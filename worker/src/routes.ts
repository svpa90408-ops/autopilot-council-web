import { ensureSeedData, getDashboard, getRecentMessages, setSetting } from "./db";
import { congressTradeToCandidate, type NormalizedCongressTrade } from "./data/congress";
import { getSecSubmissions, getCompanyFacts } from "./data/sec";
import { searchGdelt } from "./data/gdelt";
import { getMarketQuote } from "./data/market";
import type { Env, StrategyId } from "./types";
import { json, readJsonBody, isoNow } from "./utils";
import { approveDecision, rejectDecision, runResearchCycle } from "./services/cycle";
import { runCouncilMeeting } from "./services/meeting";
import { createImprovementProposal } from "./services/learning";

function parseStrategy(value: unknown): StrategyId | undefined {
  return ["congress", "news", "whales", "quant", "consensus"].includes(String(value))
    ? String(value) as StrategyId
    : undefined;
}

export async function handlePublicRequest(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true, version: "4.0.0", mode: env.APP_MODE, liveTradingEnabled: env.LIVE_TRADING_ENABLED !== "false", now: isoNow() });
  }
  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    return json(await getDashboard(env));
  }
  if (request.method === "GET" && url.pathname === "/api/conversations") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 250);
    return json({ messages: await getRecentMessages(env, limit) });
  }
  if (request.method === "GET" && url.pathname === "/api/market/quote") {
    const symbol = url.searchParams.get("symbol") ?? "";
    return json(await getMarketQuote(env, symbol));
  }
  if (request.method === "GET" && url.pathname === "/api/news/search") {
    const query = url.searchParams.get("q") ?? "";
    if (!query) return json({ error: "q is required." }, { status: 400 });
    return json({ evidence: await searchGdelt(query, 25) });
  }
  if (request.method === "GET" && url.pathname === "/api/sec/submissions") {
    const cik = url.searchParams.get("cik") ?? "";
    return json({ evidence: await getSecSubmissions(env, cik) });
  }
  if (request.method === "GET" && url.pathname === "/api/sec/companyfacts") {
    const cik = url.searchParams.get("cik") ?? "";
    return json(await getCompanyFacts(env, cik));
  }
  return null;
}

export async function handleAdminRequest(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (request.method === "POST" && url.pathname === "/api/admin/cycle") {
    const body = await readJsonBody<{ strategy?: string; autoExecute?: boolean }>(request);
    const decision = await runResearchCycle(env, parseStrategy(body.strategy), Boolean(body.autoExecute));
    return json({ decision });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/meeting") {
    return json({ meetingId: await runCouncilMeeting(env, "manual") });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/approve") {
    const body = await readJsonBody<{ decisionId: number }>(request);
    return json(await approveDecision(env, Number(body.decisionId)));
  }
  if (request.method === "POST" && url.pathname === "/api/admin/reject") {
    const body = await readJsonBody<{ decisionId: number; reason?: string }>(request);
    await rejectDecision(env, Number(body.decisionId), body.reason ?? "Rejected by user.");
    return json({ ok: true });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/halt") {
    const body = await readJsonBody<{ halted: boolean }>(request);
    await setSetting(env, "system_halted", body.halted ? "true" : "false");
    return json({ halted: body.halted });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/mode") {
    const body = await readJsonBody<{ mode: "approval" | "autopilot" }>(request);
    if (!['approval', 'autopilot'].includes(body.mode)) return json({ error: "Invalid mode." }, { status: 400 });
    await setSetting(env, "execution_mode", body.mode);
    return json({ mode: body.mode });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/congress/import") {
    const body = await readJsonBody<{ trades: NormalizedCongressTrade[] }>(request);
    if (!Array.isArray(body.trades) || !body.trades.length) return json({ error: "trades array is required." }, { status: 400 });
    let imported = 0;
    for (const trade of body.trades) {
      congressTradeToCandidate(trade, 0); // validates the payload
      await env.DB.prepare(
        `INSERT INTO congress_trades
         (politician, owner, symbol, transaction_type, transaction_date, disclosure_date,
          amount_min, amount_max, official_url, payload_json, processed, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
      ).bind(
        trade.politician, trade.owner, trade.symbol.toUpperCase(), trade.transactionType,
        trade.transactionDate, trade.disclosureDate, trade.amountMin ?? null,
        trade.amountMax ?? null, trade.officialUrl ?? null, JSON.stringify(trade), isoNow()
      ).run();
      imported += 1;
    }
    return json({ imported });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/institutional/import") {
    const body = await readJsonBody<{ signals: Record<string, unknown>[] }>(request);
    if (!Array.isArray(body.signals)) return json({ error: "signals array is required." }, { status: 400 });
    let imported = 0;
    for (const signal of body.signals) {
      const symbol = String(signal.symbol ?? "").toUpperCase();
      if (!symbol) continue;
      await env.DB.prepare(
        `INSERT INTO institutional_signals
         (source_type, symbol, filing_date, payload_json, processed, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`
      ).bind(String(signal.sourceType ?? "institutional"), symbol, String(signal.filingDate ?? isoNow()), JSON.stringify(signal), isoNow()).run();
      imported += 1;
    }
    return json({ imported });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/traders/import") {
    const body = await readJsonBody<{ signals: Record<string, unknown>[] }>(request);
    if (!Array.isArray(body.signals)) return json({ error: "signals array is required." }, { status: 400 });
    let imported = 0;
    for (const signal of body.signals) {
      const symbol = String(signal.symbol ?? "").toUpperCase();
      const traderId = String(signal.traderId ?? "");
      if (!symbol || !traderId) continue;
      await env.DB.prepare(
        `INSERT INTO trader_signals
         (trader_id, symbol, action, verified, broker_verified, signal_time, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        traderId, symbol, String(signal.action ?? "HOLD"), signal.verified ? 1 : 0,
        signal.brokerVerified ? 1 : 0, String(signal.timestamp ?? isoNow()), JSON.stringify(signal), isoNow()
      ).run();
      imported += 1;
    }
    return json({ imported });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/evidence/import") {
    const body = await readJsonBody<{ items: Record<string, unknown>[] }>(request);
    if (!Array.isArray(body.items)) return json({ error: "items array is required." }, { status: 400 });
    let imported = 0;
    for (const item of body.items) {
      await env.DB.prepare(
        `INSERT INTO evidence
         (source_type, source_name, url, title, published_at, retrieved_at, trust_tier,
          status, summary, symbol, raw_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        String(item.sourceType ?? "manual"), String(item.sourceName ?? "Manual import"), item.url ?? null,
        String(item.title ?? "Imported evidence"), item.publishedAt ?? null, isoNow(), Number(item.trustTier ?? 3),
        String(item.status ?? "UNVERIFIED"), String(item.summary ?? ""), item.symbol ?? null, JSON.stringify(item)
      ).run();
      imported += 1;
    }
    return json({ imported });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/improvements/propose") {
    const body = await readJsonBody<{ owner: string; title: string; detail: string }>(request);
    return json({ proposalId: await createImprovementProposal(env, body.owner, body.title, body.detail) });
  }
  if (request.method === "POST" && url.pathname === "/api/admin/seed") {
    await ensureSeedData(env);
    return json({ ok: true });
  }
  return null;
}
