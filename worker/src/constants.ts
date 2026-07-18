import type { StrategyId } from "./types";

export const STRATEGIES: Record<StrategyId, { name: string; horizon: string }> = {
  congress: { name: "Congress Intelligence", horizon: "1–6 months" },
  news: { name: "News & Catalysts", horizon: "2 days–4 weeks" },
  whales: { name: "Whales & Insiders", horizon: "3–12 months" },
  quant: { name: "Quant Intelligence", horizon: "1–10 days" },
  consensus: { name: "Top 10 Consensus", horizon: "same day–2 weeks" }
};

export const RISK_LIMITS = Object.freeze({
  normalPositionPct: 5,
  strongPositionPct: 8,
  exceptionalPositionPct: 10,
  absoluteMaxPositionPct: 10,
  dailyLossPct: 2,
  weeklyLossPct: 5,
  maxDrawdownPct: 10,
  maxSectorPct: 30,
  maxCorrelatedHoldings: 3,
  minimumCashReservePct: 20,
  maxOpenPositionsByStrategy: {
    congress: 8,
    news: 6,
    whales: 8,
    quant: 5,
    consensus: 6
  } satisfies Record<StrategyId, number>
});

export const SOURCE_TIERS = Object.freeze({
  official: 1,
  government: 1,
  majorNews: 2,
  specialist: 3,
  analyst: 4,
  social: 5
});

export const BLOCKED_SECURITY_TYPES = ["PENNY", "OTC", "ILLIQUID"] as const;
