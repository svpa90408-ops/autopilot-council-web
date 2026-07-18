import { getLatestDecision, getPortfolios, storeDecision } from "../db";
import { buildCandidate } from "../data/candidates";
import { getMarketQuote } from "../data/market";
import { runCouncil } from "../agents/aiCouncil";
import { mergeDecision } from "../agents/ruleCouncil";
import type { CouncilDecision, Env, StrategyId } from "../types";
import { isoNow } from "../utils";
import { assessRisk } from "./risk";
import { countOpenPositions, createPaperOrder, getPortfolio, markHoldings } from "./portfolio";
import { detectLossReviews } from "./learning";

const ROTATION: StrategyId[] = ["congress", "news", "whales", "quant", "consensus"];

export async function runResearchCycle(env: Env, requestedStrategy?: StrategyId, autoExecute = false): Promise<CouncilDecision> {
  const indexRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM decisions").first<{ count: number }>();
  const strategy = requestedStrategy ?? ROTATION[(Number(indexRow?.count ?? 0)) % ROTATION.length]!;
  const candidate = await buildCandidate(env, strategy);
  const council = await runCouncil(env, candidate);
  const portfolio = await getPortfolio(env, candidate.strategy);
  const openPositions = await countOpenPositions(env, candidate.strategy);
  const risk = await assessRisk(env, candidate, portfolio, openPositions, council.factScore, council.bullScore, council.bearScore);
  const decision = mergeDecision(candidate, council, risk.score, risk.passed, risk.allocationPct, risk.reasons);
  const decisionId = await storeDecision(env, decision);

  await env.DB.prepare(
    `INSERT INTO research_tasks (priority, department, title, status, payload_json, created_at, updated_at)
     VALUES ('P2', ?, ?, 'COMPLETED', ?, ?, ?)`
  ).bind(candidate.strategy, candidate.headline, JSON.stringify({ decisionId, symbol: candidate.symbol }), isoNow(), isoNow()).run();

  const executable = ["STRONG BUY", "BUY", "SMALL TEST POSITION"].includes(decision.verdict);
  if (autoExecute && executable && decision.allocationPct > 0) {
    const quote = await getMarketQuote(env, candidate.symbol);
    await createPaperOrder(env, decisionId, decision, quote);
  }

  await refreshMarks(env);
  await detectLossReviews(env);
  return decision;
}

export async function approveDecision(env: Env, decisionId: number): Promise<{ orderId: number }> {
  const row = await env.DB.prepare("SELECT payload_json FROM decisions WHERE id = ?").bind(decisionId).first<{ payload_json: string }>();
  if (!row) throw new Error("Decision not found.");
  const decision = JSON.parse(row.payload_json) as CouncilDecision;
  if (!["STRONG BUY", "BUY", "SMALL TEST POSITION"].includes(decision.verdict) || decision.riskVeto || decision.factVeto) {
    throw new Error("Decision is not eligible for paper execution.");
  }
  const existing = await env.DB.prepare("SELECT id FROM paper_orders WHERE decision_id = ?").bind(decisionId).first();
  if (existing) throw new Error("Decision already has a paper order.");
  const quote = await getMarketQuote(env, decision.candidate.symbol);
  const orderId = await createPaperOrder(env, decisionId, decision, quote);
  await refreshMarks(env);
  return { orderId };
}

export async function rejectDecision(env: Env, decisionId: number, reason: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO paper_orders
     (decision_id, strategy, symbol, side, quantity, reference_price, notional,
      status, reason, created_at)
     SELECT id, strategy, symbol, 'BUY', 0, 0, 0, 'REJECTED', ?, ? FROM decisions WHERE id = ?`
  ).bind(reason, isoNow(), decisionId).run();
}

export async function refreshMarks(env: Env): Promise<void> {
  const holdings = await env.DB.prepare("SELECT DISTINCT symbol FROM holdings WHERE status = 'OPEN'").all<{ symbol: string }>();
  const quotes = [];
  for (const row of holdings.results ?? []) {
    try { quotes.push(await getMarketQuote(env, row.symbol)); } catch { /* preserve last mark */ }
  }
  if (quotes.length) await markHoldings(env, quotes);
}

export async function getMostRecentDecision(env: Env): Promise<CouncilDecision | null> {
  return getLatestDecision(env);
}
