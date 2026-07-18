import type { Candidate, Env, EvidenceItem, StrategyId } from "../types";
import { clamp, isoNow, safeJsonParse } from "../utils";
import { searchGdelt } from "./gdelt";
import { getMarketQuote } from "./market";
import { congressTradeToCandidate, type NormalizedCongressTrade } from "./congress";
import { buildConsensusCandidate, type VerifiedTraderSignal } from "./traders";

const DEFAULT_UNIVERSE = ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "JPM", "XOM", "LLY"];

export async function buildCandidate(env: Env, strategy: StrategyId): Promise<Candidate> {
  switch (strategy) {
    case "congress":
      return buildCongressCandidate(env);
    case "news":
      return buildNewsCandidate(env);
    case "whales":
      return buildWhaleCandidate(env);
    case "quant":
      return buildQuantCandidate(env);
    case "consensus":
      return buildTraderCandidate(env);
  }
}

async function buildCongressCandidate(env: Env): Promise<Candidate> {
  const row = await env.DB.prepare(
    `SELECT payload_json FROM congress_trades WHERE processed = 0 ORDER BY disclosure_date DESC, id DESC LIMIT 1`
  ).first<{ payload_json: string }>();
  if (!row) {
    return placeholderCandidate("congress", "No unprocessed official congressional disclosure is available.");
  }
  const trade = safeJsonParse<NormalizedCongressTrade | null>(row.payload_json, null);
  if (!trade) return placeholderCandidate("congress", "Congress disclosure payload is invalid.");

  let change = 0;
  try {
    const quote = await getMarketQuote(env, trade.symbol);
    change = quote.changePct;
  } catch {
    // Fact Checker will mark missing market data as incomplete.
  }
  return congressTradeToCandidate(trade, change);
}

async function buildTraderCandidate(env: Env): Promise<Candidate> {
  const result = await env.DB.prepare(
    `SELECT payload_json FROM trader_signals
     WHERE verified = 1 AND signal_time >= datetime('now', '-7 days')
     ORDER BY signal_time DESC LIMIT 200`
  ).all<{ payload_json: string }>();
  const signals = (result.results ?? [])
    .map((row) => safeJsonParse<VerifiedTraderSignal | null>(row.payload_json, null))
    .filter((row): row is VerifiedTraderSignal => Boolean(row));
  if (signals.length < 10) {
    return placeholderCandidate("consensus", "Fewer than ten verified trader signals are available.");
  }
  return buildConsensusCandidate(signals);
}

async function buildNewsCandidate(env: Env): Promise<Candidate> {
  const symbol = DEFAULT_UNIVERSE[Math.floor(Date.now() / 1_800_000) % DEFAULT_UNIVERSE.length] ?? "MSFT";
  const evidence = await searchGdelt(`${symbol} (earnings OR contract OR partnership OR regulation OR acquisition)`, 12);
  let quote = null;
  try { quote = await getMarketQuote(env, symbol); } catch { quote = null; }

  const recentEvidence = evidence.filter((item) => {
    const published = Date.parse(item.publishedAt ?? "");
    return Number.isFinite(published) && Date.now() - published <= 3 * 86_400_000;
  });
  const primaryConfirmation = await findOfficialEvidence(env, symbol);
  const allEvidence = [...primaryConfirmation, ...recentEvidence.slice(0, 8)];
  const verifiedCount = allEvidence.filter((item) => item.status === "VERIFIED").length;

  return {
    strategy: "news",
    symbol,
    proposedAction: "BUY",
    headline: `${symbol} catalyst scan found ${allEvidence.length} evidence items`,
    rationale: "News leads require primary-source confirmation and an already-priced-in check.",
    signalStrength: clamp(0.45 + Math.min(allEvidence.length, 10) * 0.04 + verifiedCount * 0.08, 0.2, 0.94),
    sourceAgeDays: 1,
    factCompleteness: clamp(0.45 + verifiedCount * 0.18 + (quote ? 0.15 : 0), 0.2, 0.98),
    eventRisk: clamp(0.42 + (quote ? Math.abs(quote.changePct) / 20 : 0.18), 0.2, 0.9),
    priceChangePct: quote?.changePct ?? 0,
    evidence: allEvidence.length ? allEvidence : [missingEvidence("news", symbol)],
    metadata: { price: quote?.price, priceSource: quote?.source, sector: "UNKNOWN" }
  };
}

async function buildWhaleCandidate(env: Env): Promise<Candidate> {
  const row = await env.DB.prepare(
    `SELECT payload_json FROM institutional_signals WHERE processed = 0 ORDER BY filing_date DESC, id DESC LIMIT 1`
  ).first<{ payload_json: string }>();
  if (!row) return placeholderCandidate("whales", "No unprocessed institutional or insider signal is available.");
  const payload = safeJsonParse<Record<string, unknown>>(row.payload_json, {});
  const symbol = String(payload.symbol ?? "").toUpperCase();
  if (!symbol) return placeholderCandidate("whales", "Institutional signal has no valid symbol.");
  let quote = null;
  try { quote = await getMarketQuote(env, symbol); } catch { quote = null; }
  const evidence: EvidenceItem[] = [{
    sourceType: "institutional_filing",
    sourceName: String(payload.sourceName ?? "Imported official filing"),
    url: typeof payload.officialUrl === "string" ? payload.officialUrl : undefined,
    title: String(payload.title ?? `${symbol} institutional signal`),
    publishedAt: String(payload.filingDate ?? isoNow()),
    retrievedAt: isoNow(),
    trustTier: 1,
    status: "VERIFIED",
    summary: String(payload.summary ?? "Official filing-derived institutional signal."),
    symbol,
    raw: payload
  }];
  return {
    strategy: "whales",
    symbol,
    proposedAction: String(payload.action ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY",
    headline: String(payload.title ?? `${symbol} institutional activity`),
    rationale: "Delayed capital-flow signal requiring fundamentals and current-entry verification.",
    signalStrength: clamp(Number(payload.signalStrength ?? 0.68), 0.2, 0.95),
    sourceAgeDays: Number(payload.sourceAgeDays ?? 30),
    factCompleteness: quote ? 0.92 : 0.78,
    eventRisk: clamp(Number(payload.eventRisk ?? 0.42) + Math.abs(quote?.changePct ?? 0) / 20, 0.2, 0.92),
    priceChangePct: quote?.changePct ?? 0,
    evidence,
    metadata: { ...payload, price: quote?.price, priceSource: quote?.source }
  };
}

async function buildQuantCandidate(env: Env): Promise<Candidate> {
  const quotes = [];
  for (const symbol of DEFAULT_UNIVERSE.slice(0, 5)) {
    try { quotes.push(await getMarketQuote(env, symbol)); } catch { /* skip unavailable quote */ }
  }
  if (!quotes.length) return placeholderCandidate("quant", "No market-data provider is configured.");
  const quote = [...quotes].sort((a, b) => b.changePct - a.changePct)[0]!;
  const evidence: EvidenceItem[] = [{
    sourceType: "market_data",
    sourceName: quote.source,
    title: `${quote.symbol} quote and daily change`,
    publishedAt: quote.timestamp,
    retrievedAt: isoNow(),
    trustTier: 2,
    status: "VERIFIED",
    summary: `${quote.symbol} price ${quote.price}, daily change ${quote.changePct.toFixed(2)}%.`,
    symbol: quote.symbol,
    raw: quote
  }];
  return {
    strategy: "quant",
    symbol: quote.symbol,
    proposedAction: quote.changePct > 0 ? "BUY" : "HOLD",
    headline: `${quote.symbol} leads the configured real-price scanner`,
    rationale: "Fast numerical candidate; requires historical candles before production-grade technical analysis.",
    signalStrength: clamp(0.55 + quote.changePct / 15, 0.25, 0.88),
    sourceAgeDays: 0,
    factCompleteness: 0.84,
    eventRisk: clamp(0.3 + Math.abs(quote.changePct) / 12, 0.2, 0.9),
    priceChangePct: quote.changePct,
    evidence,
    metadata: { price: quote.price, priceSource: quote.source, sector: "UNKNOWN" }
  };
}

async function findOfficialEvidence(env: Env, symbol: string): Promise<EvidenceItem[]> {
  const result = await env.DB.prepare(
    `SELECT source_type, source_name, url, title, published_at, retrieved_at,
            trust_tier, status, summary, symbol, raw_json
     FROM evidence WHERE symbol = ? AND trust_tier = 1
     ORDER BY published_at DESC LIMIT 5`
  ).bind(symbol).all<Record<string, unknown>>();
  return (result.results ?? []).map((row) => ({
    sourceType: String(row.source_type),
    sourceName: String(row.source_name),
    url: row.url ? String(row.url) : undefined,
    title: String(row.title),
    publishedAt: row.published_at ? String(row.published_at) : undefined,
    retrievedAt: String(row.retrieved_at),
    trustTier: Number(row.trust_tier),
    status: String(row.status) as EvidenceItem["status"],
    summary: String(row.summary),
    symbol: row.symbol ? String(row.symbol) : undefined,
    raw: safeJsonParse(String(row.raw_json ?? "{}"), {})
  }));
}

function placeholderCandidate(strategy: StrategyId, reason: string): Candidate {
  return {
    strategy,
    symbol: "NONE",
    proposedAction: "HOLD",
    headline: reason,
    rationale: reason,
    signalStrength: 0,
    sourceAgeDays: 999,
    factCompleteness: 0,
    eventRisk: 1,
    priceChangePct: 0,
    evidence: [missingEvidence(strategy, "NONE")],
    metadata: { unavailable: true }
  };
}

function missingEvidence(sourceType: string, symbol: string): EvidenceItem {
  return {
    sourceType,
    sourceName: "System",
    title: "Required evidence is not configured",
    retrievedAt: isoNow(),
    trustTier: 5,
    status: "UNVERIFIED",
    summary: "The system will not invent missing source data.",
    symbol
  };
}
