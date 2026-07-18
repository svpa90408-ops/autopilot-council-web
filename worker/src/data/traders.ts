import type { Candidate, EvidenceItem } from "../types";
import { clamp, isoNow } from "../utils";

export interface VerifiedTraderSignal {
  traderId: string;
  displayName: string;
  verified: boolean;
  brokerVerified: boolean;
  riskAdjustedReturn: number;
  maxDrawdown: number;
  consistency: number;
  completedTrades: number;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  timestamp: string;
  sourceUrl?: string;
}

export function buildConsensusCandidate(signals: VerifiedTraderSignal[]): Candidate {
  const eligible = signals
    .filter((signal) => signal.verified && signal.completedTrades >= 30)
    .sort((a, b) => scoreTrader(b) - scoreTrader(a))
    .slice(0, 10);
  if (eligible.length < 10) throw new Error("At least ten verified trader signals are required.");

  const symbolCounts = new Map<string, { buy: number; sell: number; hold: number }>();
  for (const signal of eligible) {
    const counts = symbolCounts.get(signal.symbol) ?? { buy: 0, sell: 0, hold: 0 };
    counts[signal.action.toLowerCase() as "buy" | "sell" | "hold"] += 1;
    symbolCounts.set(signal.symbol, counts);
  }
  const ranked = [...symbolCounts.entries()].sort((a, b) => b[1].buy - a[1].buy);
  const best = ranked[0];
  if (!best) throw new Error("No consensus symbol was found.");
  const [symbol, counts] = best;

  const evidence: EvidenceItem[] = eligible.map((signal) => ({
    sourceType: "verified_trader_signal",
    sourceName: signal.displayName,
    url: signal.sourceUrl,
    title: `${signal.displayName}: ${signal.action} ${signal.symbol}`,
    publishedAt: signal.timestamp,
    retrievedAt: isoNow(),
    trustTier: signal.brokerVerified ? 1 : 3,
    status: signal.brokerVerified ? "VERIFIED" : "UNVERIFIED",
    summary: `Trader track record score ${scoreTrader(signal).toFixed(1)}.`,
    symbol: signal.symbol,
    raw: signal
  }));

  return {
    strategy: "consensus",
    symbol,
    proposedAction: counts.buy >= 7 ? "BUY" : "HOLD",
    headline: `${counts.buy}/10 verified top traders signal BUY ${symbol}`,
    rationale: "Consensus signal must still pass independent company, timing, liquidity and risk analysis.",
    signalStrength: clamp(counts.buy / 10, 0, 1),
    sourceAgeDays: 0,
    factCompleteness: eligible.filter((item) => item.brokerVerified).length / 10,
    eventRisk: clamp((counts.sell * 1.3 + counts.hold * 0.7) / 10, 0.1, 0.9),
    priceChangePct: 0,
    evidence,
    metadata: { buy: counts.buy, sell: counts.sell, hold: counts.hold, traders: eligible.map((x) => x.traderId) }
  };
}

export function scoreTrader(signal: VerifiedTraderSignal): number {
  const sampleBonus = Math.min(signal.completedTrades, 300) / 30;
  return signal.riskAdjustedReturn - signal.maxDrawdown * 1.25 + signal.consistency * 0.18 + sampleBonus;
}
