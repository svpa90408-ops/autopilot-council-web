import { describe, expect, it } from "vitest";
import { runRuleCouncil } from "../src/agents/ruleCouncil";
import type { Candidate } from "../src/types";

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    strategy: "news",
    symbol: "MSFT",
    proposedAction: "BUY",
    headline: "Confirmed company catalyst",
    rationale: "Primary source and current market data.",
    signalStrength: 0.84,
    sourceAgeDays: 1,
    factCompleteness: 0.95,
    eventRisk: 0.28,
    priceChangePct: 1.2,
    evidence: [
      {
        sourceType: "company_announcement",
        sourceName: "Company investor relations",
        title: "Official announcement",
        retrievedAt: new Date().toISOString(),
        trustTier: 1,
        status: "VERIFIED",
        summary: "Official primary source."
      }
    ],
    metadata: {},
    ...overrides
  };
}

describe("rule council", () => {
  it("can approve a strong verified candidate", () => {
    const output = runRuleCouncil(candidate());
    expect(["BUY", "STRONG BUY", "SMALL TEST POSITION"]).toContain(output.suggestedVerdict);
    expect(output.factScore).toBeGreaterThanOrEqual(80);
  });

  it("rejects insufficient evidence", () => {
    const output = runRuleCouncil(candidate({
      factCompleteness: 0.3,
      evidence: [{
        sourceType: "social",
        sourceName: "Unknown account",
        title: "Rumour",
        retrievedAt: new Date().toISOString(),
        trustTier: 5,
        status: "UNVERIFIED",
        summary: "Unverified rumour."
      }]
    }));
    expect(output.suggestedVerdict).toBe("INSUFFICIENT EVIDENCE");
  });
});
