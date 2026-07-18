import { describe, expect, it } from "vitest";
import { buildConsensusCandidate, type VerifiedTraderSignal } from "../src/data/traders";

function signal(index: number, action: "BUY" | "SELL" | "HOLD"): VerifiedTraderSignal {
  return {
    traderId: `t${index}`,
    displayName: `Trader ${index}`,
    verified: true,
    brokerVerified: true,
    riskAdjustedReturn: 20 + index,
    maxDrawdown: 5,
    consistency: 70,
    completedTrades: 100,
    symbol: "AAPL",
    action,
    timestamp: new Date().toISOString()
  };
}

describe("top trader consensus", () => {
  it("requires a real top-ten set and counts agreement", () => {
    const signals = Array.from({ length: 10 }, (_, index) => signal(index, index < 8 ? "BUY" : "HOLD"));
    const candidate = buildConsensusCandidate(signals);
    expect(candidate.symbol).toBe("AAPL");
    expect(candidate.proposedAction).toBe("BUY");
    expect(candidate.metadata.buy).toBe(8);
  });
});
