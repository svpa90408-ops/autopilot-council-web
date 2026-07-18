import type { Env } from "../types";
import { isoNow } from "../utils";

export async function detectLossReviews(env: Env): Promise<number> {
  const result = await env.DB.prepare(
    `SELECT h.id, h.strategy, h.symbol, h.average_price, h.current_price,
            ((h.current_price / h.average_price) - 1) * 100 AS pnl_pct
     FROM holdings h
     LEFT JOIN loss_reviews lr ON lr.holding_id = h.id AND lr.status != 'CLOSED'
     WHERE h.status = 'OPEN' AND h.current_price < h.average_price * 0.975 AND lr.id IS NULL`
  ).all<Record<string, unknown>>();

  let created = 0;
  for (const row of result.results ?? []) {
    const questions = [
      "What did the department predict?",
      "What actually happened?",
      "Which assumption failed?",
      "Which agent was most accurate?",
      "Was the data wrong, stale or merely mistimed?",
      "Was position sizing appropriate?",
      "Should a rule-change proposal be created?"
    ];
    await env.DB.prepare(
      `INSERT INTO loss_reviews
       (holding_id, strategy, symbol, pnl_pct, classification, questions_json, status, created_at)
       VALUES (?, ?, ?, ?, 'UNDER REVIEW', ?, 'OPEN', ?)`
    ).bind(row.id, row.strategy, row.symbol, row.pnl_pct, JSON.stringify(questions), isoNow()).run();
    created += 1;
  }
  return created;
}

export async function createImprovementProposal(
  env: Env,
  owner: string,
  title: string,
  detail: string
): Promise<number> {
  const result = await env.DB.prepare(
    `INSERT INTO improvement_proposals
     (owner, title, detail, status, backtest_result_json, user_approved, created_at, updated_at)
     VALUES (?, ?, ?, 'PROPOSED', '{}', 0, ?, ?)`
  ).bind(owner, title, detail, isoNow(), isoNow()).run();
  return Number(result.meta.last_row_id ?? 0);
}
