import { RISK_LIMITS } from "../constants";
import type { Candidate, Env, Portfolio, RiskResult } from "../types";
import { clamp } from "../utils";

export async function assessRisk(
  env: Env,
  candidate: Candidate,
  portfolio: Portfolio,
  openPositions: number,
  factScore: number,
  bullScore: number,
  bearScore: number
): Promise<RiskResult> {
  const reasons: string[] = [];
  let score = 100;

  if (env.APP_MODE !== "paper" || env.LIVE_TRADING_ENABLED !== "false") {
    return { passed: false, score: 0, allocationPct: 0, reasons: ["Paper-only safety lock is not active."] };
  }

  const symbol = candidate.symbol.toUpperCase();
  if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol)) {
    reasons.push("Invalid or unverifiable symbol.");
    score -= 100;
  }
  if (candidate.metadata.securityType === "PENNY" || Number(candidate.metadata.price ?? 999) < 1) {
    reasons.push("Penny stocks are blocked.");
    score -= 100;
  }
  if (factScore < 68) {
    reasons.push("Fact Checker score is below the minimum.");
    score -= 60;
  }
  if (candidate.evidence.every((item) => item.status !== "VERIFIED")) {
    reasons.push("No verified evidence supports the candidate.");
    score -= 60;
  }
  if (Math.abs(candidate.priceChangePct) > 8) {
    reasons.push("Recent price movement is too extreme for a new entry.");
    score -= 35;
  }
  if (bearScore >= 80) {
    reasons.push("Bear case exceeds the maximum risk threshold.");
    score -= 35;
  }
  const maxPositions = RISK_LIMITS.maxOpenPositionsByStrategy[candidate.strategy];
  if (openPositions >= maxPositions) {
    reasons.push(`Maximum open positions reached for ${candidate.strategy}.`);
    score -= 100;
  }
  const reserve = portfolio.value * (RISK_LIMITS.minimumCashReservePct / 100);
  if (portfolio.cash <= reserve) {
    reasons.push("Minimum cash reserve would be breached.");
    score -= 100;
  }
  if (portfolio.halted) {
    reasons.push("Portfolio is halted.");
    score -= 100;
  }

  let allocationPct: number = RISK_LIMITS.normalPositionPct;
  const advantage = bullScore - bearScore;
  if (advantage >= 38 && factScore >= 88) allocationPct = RISK_LIMITS.exceptionalPositionPct;
  else if (advantage >= 25 && factScore >= 78) allocationPct = RISK_LIMITS.strongPositionPct;

  allocationPct = Math.min(allocationPct, RISK_LIMITS.absoluteMaxPositionPct);
  const allocation = portfolio.value * (allocationPct / 100);
  if (portfolio.cash - allocation < reserve) {
    allocationPct = Math.max(0, ((portfolio.cash - reserve) / portfolio.value) * 100);
    reasons.push("Allocation reduced to preserve the cash reserve.");
  }

  const passed = score >= 60 && allocationPct >= 1 && !reasons.some((reason) =>
    reason.includes("blocked") || reason.includes("Invalid") || reason.includes("No verified") || reason.includes("halted") || reason.includes("Maximum open") || reason.includes("Fact Checker")
  );

  return {
    passed,
    score: clamp(score, 0, 100),
    allocationPct: passed ? Math.round(allocationPct * 100) / 100 : 0,
    reasons: reasons.length ? reasons : ["All hard risk checks passed."]
  };
}
