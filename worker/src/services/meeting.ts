import type { AgentMessage, Env } from "../types";
import { getRecentMessages } from "../db";
import { isoNow } from "../utils";

const MEETING_AGENTS = [
  "PERFORMANCE SCIENTIST",
  "BIAS DETECTOR",
  "DATA QUALITY RESEARCHER",
  "PORTFOLIO ANALYST",
  "IMPROVEMENT JUDGE"
];

export async function runCouncilMeeting(env: Env, trigger: "scheduled" | "manual"): Promise<number> {
  const messages = await getRecentMessages(env, 40);
  const decisions = await env.DB.prepare(
    "SELECT strategy, symbol, verdict, confidence, fact_veto, risk_veto, summary, created_at FROM decisions ORDER BY id DESC LIMIT 20"
  ).all<Record<string, unknown>>();
  const reviews = await env.DB.prepare(
    "SELECT strategy, symbol, pnl_pct, classification, status FROM loss_reviews ORDER BY id DESC LIMIT 10"
  ).all<Record<string, unknown>>();

  const summary = {
    trigger,
    decisionsReviewed: decisions.results?.length ?? 0,
    messagesReviewed: messages.length,
    lossReviews: reviews.results?.length ?? 0,
    conclusions: [
      "Keep hard risk limits unchanged.",
      "Separate outcome quality from reasoning quality.",
      "Require primary-source confirmation for large catalyst trades.",
      "Do not promote unverified trader or social-media signals.",
      "Send proposed reasoning changes through backtest, shadow simulation and user approval."
    ]
  };

  const result = await env.DB.prepare(
    `INSERT INTO meetings (meeting_type, trigger_type, summary_json, started_at, completed_at)
     VALUES ('THIRTY_MINUTE_COUNCIL', ?, ?, ?, ?)`
  ).bind(trigger, JSON.stringify(summary), isoNow(), isoNow()).run();
  const meetingId = Number(result.meta.last_row_id ?? 0);

  const meetingMessages: AgentMessage[] = MEETING_AGENTS.map((agent, index) => ({
    agent,
    department: "meta_learning",
    role: "Thirty-minute review",
    text: summary.conclusions[index] ?? "Review complete.",
    confidence: 80 - index * 3,
    evidenceStatuses: ["MEETING", "GOVERNANCE"],
    createdAt: isoNow()
  }));

  if (meetingMessages.length) {
    await env.DB.batch(meetingMessages.map((message) => env.DB.prepare(
      `INSERT INTO agent_messages
       (meeting_id, agent, department, role, text, confidence, evidence_statuses_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(meetingId, message.agent, message.department, message.role, message.text, message.confidence, JSON.stringify(message.evidenceStatuses), message.createdAt)));
  }

  return meetingId;
}
