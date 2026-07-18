import type { Candidate, EvidenceItem } from "../types";
import { clamp, isoNow } from "../utils";

export interface NormalizedCongressTrade {
  politician: string;
  owner: "self" | "spouse" | "dependent" | "unknown";
  symbol: string;
  transactionType: "purchase" | "sale" | "exchange";
  transactionDate: string;
  disclosureDate: string;
  amountMin?: number;
  amountMax?: number;
  officialUrl?: string;
  committeeNotes?: string[];
}

export function congressTradeToCandidate(trade: NormalizedCongressTrade, priceChangePct = 0): Candidate {
  const transactionTime = Date.parse(trade.transactionDate);
  const disclosureTime = Date.parse(trade.disclosureDate);
  if (!Number.isFinite(transactionTime) || !Number.isFinite(disclosureTime)) {
    throw new Error("Congress trade must contain valid transaction and disclosure dates.");
  }
  const delayDays = Math.max(0, Math.round((disclosureTime - transactionTime) / 86_400_000));
  const evidence: EvidenceItem[] = [{
    sourceType: "congress_disclosure",
    sourceName: "Official financial disclosure import",
    url: trade.officialUrl,
    title: `${trade.politician} ${trade.transactionType} ${trade.symbol}`,
    publishedAt: trade.disclosureDate,
    retrievedAt: isoNow(),
    trustTier: 1,
    status: delayDays > 30 ? "STALE" : "VERIFIED",
    summary: `Officially sourced transaction disclosure with ${delayDays}-day reporting delay.`,
    symbol: trade.symbol,
    raw: trade
  }];

  return {
    strategy: "congress",
    symbol: trade.symbol.toUpperCase(),
    proposedAction: trade.transactionType === "sale" ? "SELL" : "BUY",
    headline: `${trade.politician} disclosed a ${trade.transactionType} in ${trade.symbol}`,
    rationale: "Public disclosure signal requiring current-price, fundamentals and policy-context verification.",
    signalStrength: clamp(0.78 - delayDays / 140 + (trade.committeeNotes?.length ? 0.06 : 0), 0.3, 0.92),
    sourceAgeDays: delayDays,
    factCompleteness: trade.officialUrl ? 0.96 : 0.84,
    eventRisk: clamp(0.25 + delayDays / 90 + Math.abs(priceChangePct) / 20, 0.15, 0.92),
    priceChangePct,
    evidence,
    metadata: { ...trade }
  };
}
