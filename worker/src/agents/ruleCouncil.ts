import type { AgentMessage, Candidate, CouncilDecision, Verdict } from "../types";
import { clamp, isoNow } from "../utils";

export interface RuleCouncilOutput {
  messages: AgentMessage[];
  bullScore: number;
  bearScore: number;
  factScore: number;
  confidence: number;
  summary: string;
  suggestedVerdict: Verdict;
}

function message(agent: string, department: string, role: string, text: string, confidence: number, evidenceStatuses: string[]): AgentMessage {
  return { agent, department, role, text, confidence: clamp(confidence, 0, 100), evidenceStatuses, createdAt: isoNow() };
}

export function runRuleCouncil(candidate: Candidate): RuleCouncilOutput {
  const department = candidate.strategy;
  const verified = candidate.evidence.filter((item) => item.status === "VERIFIED").length;
  const stale = candidate.evidence.filter((item) => item.status === "STALE").length;
  const unverified = candidate.evidence.filter((item) => item.status === "UNVERIFIED" || item.status === "ASSUMPTION").length;
  const evidenceCount = Math.max(candidate.evidence.length, 1);

  const freshnessBonus = candidate.sourceAgeDays <= 2 ? 10 : candidate.sourceAgeDays <= 14 ? 5 : 0;
  const delayPenalty = candidate.sourceAgeDays > 45 ? 24 : candidate.sourceAgeDays > 30 ? 15 : candidate.sourceAgeDays > 14 ? 8 : 0;
  const movePenalty = Math.abs(candidate.priceChangePct) > 6 ? 22 : Math.abs(candidate.priceChangePct) > 3 ? 12 : 0;

  const bullScore = clamp(Math.round(candidate.signalStrength * 72 + freshnessBonus + verified * 4 - stale * 3), 0, 100);
  const bearScore = clamp(Math.round(candidate.eventRisk * 68 + delayPenalty + movePenalty + unverified * 7), 0, 100);
  const factScore = clamp(Math.round(candidate.factCompleteness * 100 - unverified * 7 - stale * 3), 0, 100);
  const advantage = bullScore - bearScore;

  let suggestedVerdict: Verdict;
  if (factScore < 68 || verified === 0) suggestedVerdict = "INSUFFICIENT EVIDENCE";
  else if (bearScore >= 80) suggestedVerdict = "REJECT";
  else if (candidate.proposedAction === "SELL" && advantage < 0) suggestedVerdict = "SELL";
  else if (advantage >= 38 && bullScore >= 82) suggestedVerdict = "STRONG BUY";
  else if (advantage >= 25 && bullScore >= 70) suggestedVerdict = "BUY";
  else if (advantage >= 15 && bullScore >= 62) suggestedVerdict = "SMALL TEST POSITION";
  else if (advantage >= 5) suggestedVerdict = "WATCH";
  else if (candidate.priceChangePct > 3) suggestedVerdict = "WAIT FOR BETTER PRICE";
  else suggestedVerdict = "REJECT";

  const confidence = clamp(Math.round(55 + Math.abs(advantage) * 0.45 + (factScore - 70) * 0.35), 45, 94);
  const messages: AgentMessage[] = [
    message("DEEP PATTERN ANALYST", department, "Independent pattern analysis",
      `The key relationship is source age ${candidate.sourceAgeDays} days, price movement ${candidate.priceChangePct.toFixed(2)}%, and evidence completeness ${(candidate.factCompleteness * 100).toFixed(0)}%.`,
      76, [stale ? "STALE" : "VERIFIED"]),
    message("DIVERGENT EXPLORER", department, "Second-order exploration",
      "The direct signal may not be the only opportunity; suppliers, competitors and policy spillovers should be researched separately before being treated as facts.",
      63, ["ASSUMPTION"]),
    message("CONSERVATIVE REALIST", department, "Downside and timing",
      `A credible event is not automatically a good entry. Delay penalty ${delayPenalty} and price-move penalty ${movePenalty} remain relevant.`,
      81, ["RISK"]),
    message("PRACTICAL STRATEGIST", department, "Execution practicality",
      `The proposal is actionable only if evidence quality, liquidity and portfolio capacity all pass hard checks. Current suggested verdict: ${suggestedVerdict}.`,
      78, ["VERIFIED"]),
    message("BULL ANALYST", department, "Strongest positive case",
      `Bull score ${bullScore}. The strongest factors are signal strength, verified evidence and strategy fit.`,
      bullScore, verified ? ["VERIFIED"] : ["UNVERIFIED"]),
    message("BEAR ANALYST", department, "Strongest negative case",
      `Bear score ${bearScore}. The main risks are timing, stale information, unsupported assumptions and the possibility that price already reflects the signal.`,
      bearScore, ["RISK"]),
    message("FACT CHECKER", department, "Evidence verification",
      `Fact score ${factScore}. ${verified}/${evidenceCount} evidence items are verified; unsupported claims cannot support execution.`,
      factScore, factScore >= 68 ? ["VERIFIED"] : ["UNVERIFIED"]),
    message("FINAL JUDGE", department, "Evidence-weighted verdict",
      `${suggestedVerdict}. Bull ${bullScore}, Bear ${bearScore}, Facts ${factScore}.`,
      confidence, ["FINAL VERDICT"])
  ];

  return {
    messages,
    bullScore,
    bearScore,
    factScore,
    confidence,
    summary: `${candidate.headline}. Evidence-weighted advantage ${advantage}; fact quality ${factScore}.`,
    suggestedVerdict
  };
}

export function mergeDecision(candidate: Candidate, output: RuleCouncilOutput, riskScore: number, riskPassed: boolean, allocationPct: number, riskReasons: string[]): CouncilDecision {
  const factVeto = output.factScore < 68;
  const riskVeto = !riskPassed;
  const verdict = factVeto ? "INSUFFICIENT EVIDENCE" : riskVeto ? "REJECT" : output.suggestedVerdict;
  const riskMessage = message(
    "RISK MANAGER",
    candidate.strategy,
    "Hard-coded final authority",
    riskPassed ? `Risk checks passed. Allocation capped at ${allocationPct}%.` : `Risk veto: ${riskReasons.join(" ")}`,
    riskScore,
    riskPassed ? ["RISK PASSED"] : ["RISK VETO"]
  );

  return {
    candidate,
    verdict,
    bullScore: output.bullScore,
    bearScore: output.bearScore,
    factScore: output.factScore,
    confidence: output.confidence,
    riskScore,
    allocationPct: riskPassed ? allocationPct : 0,
    summary: `${output.summary} ${riskPassed ? "Hard risk checks passed." : `Risk veto: ${riskReasons.join(" ")}`}`,
    factVeto,
    riskVeto,
    messages: [...output.messages, riskMessage],
    createdAt: isoNow()
  };
}
