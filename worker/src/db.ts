import { STRATEGIES } from "./constants";
import type { AgentMessage, CouncilDecision, DashboardResponse, Env, Holding, Portfolio, StrategyId } from "./types";
import { isoNow, safeJsonParse } from "./utils";

export async function ensureSeedData(env: Env): Promise<void> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM portfolios").first<{ count: number }>();
  if ((row?.count ?? 0) > 0) return;

  const statements = Object.entries(STRATEGIES).map(([strategy, info]) =>
    env.DB.prepare(
      `INSERT INTO portfolios (strategy, name, starting_cash, cash, value, realised_pnl, halted, updated_at)
       VALUES (?, ?, 1150, 1150, 1150, 0, 0, ?)`
    ).bind(strategy, info.name, isoNow())
  );
  await env.DB.batch(statements);

  await env.DB.prepare(
    `INSERT OR IGNORE INTO system_settings (key, value, updated_at)
     VALUES ('system_halted', 'false', ?), ('execution_mode', 'approval', ?)`
  ).bind(isoNow(), isoNow()).run();
}

export async function getSetting(env: Env, key: string, fallback: string): Promise<string> {
  const row = await env.DB.prepare("SELECT value FROM system_settings WHERE key = ?").bind(key).first<{ value: string }>();
  return row?.value ?? fallback;
}

export async function setSetting(env: Env, key: string, value: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(key, value, isoNow()).run();
}

export async function getPortfolios(env: Env): Promise<Array<Portfolio & { positions: number; returnPct: number }>> {
  const result = await env.DB.prepare(
    `SELECT p.strategy, p.name, p.starting_cash AS startingCash, p.cash, p.value,
            p.realised_pnl AS realisedPnl, p.halted,
            COUNT(h.id) AS positions
     FROM portfolios p
     LEFT JOIN holdings h ON h.strategy = p.strategy AND h.status = 'OPEN'
     GROUP BY p.strategy, p.name, p.starting_cash, p.cash, p.value, p.realised_pnl, p.halted
     ORDER BY p.id`
  ).all<Record<string, unknown>>();

  return (result.results ?? []).map((row) => {
    const startingCash = Number(row.startingCash);
    const value = Number(row.value);
    return {
      strategy: row.strategy as StrategyId,
      name: String(row.name),
      startingCash,
      cash: Number(row.cash),
      value,
      realisedPnl: Number(row.realisedPnl),
      halted: Boolean(row.halted),
      positions: Number(row.positions),
      returnPct: startingCash ? ((value - startingCash) / startingCash) * 100 : 0
    };
  });
}

export async function getHoldings(env: Env): Promise<Holding[]> {
  const result = await env.DB.prepare(
    `SELECT id, strategy, symbol, quantity, average_price AS averagePrice,
            current_price AS currentPrice, opened_at AS openedAt, thesis
     FROM holdings WHERE status = 'OPEN' ORDER BY opened_at DESC`
  ).all<Record<string, unknown>>();
  return (result.results ?? []).map((row) => ({
    id: Number(row.id),
    strategy: row.strategy as StrategyId,
    symbol: String(row.symbol),
    quantity: Number(row.quantity),
    averagePrice: Number(row.averagePrice),
    currentPrice: Number(row.currentPrice),
    openedAt: String(row.openedAt),
    thesis: String(row.thesis)
  }));
}

export async function getLatestDecision(env: Env): Promise<CouncilDecision | null> {
  const row = await env.DB.prepare(
    `SELECT id, payload_json FROM decisions ORDER BY id DESC LIMIT 1`
  ).first<{ id: number; payload_json: string }>();
  if (!row) return null;
  const decision = safeJsonParse<CouncilDecision | null>(row.payload_json, null);
  return decision ? { ...decision, id: Number(row.id) } : null;
}

export async function getRecentMessages(env: Env, limit = 80): Promise<AgentMessage[]> {
  const result = await env.DB.prepare(
    `SELECT agent, department, role, text, confidence, evidence_statuses_json, created_at
     FROM agent_messages ORDER BY id DESC LIMIT ?`
  ).bind(limit).all<Record<string, unknown>>();
  return (result.results ?? []).map((row) => ({
    agent: String(row.agent),
    department: String(row.department),
    role: String(row.role),
    text: String(row.text),
    confidence: Number(row.confidence),
    evidenceStatuses: safeJsonParse<string[]>(String(row.evidence_statuses_json), []),
    createdAt: String(row.created_at)
  }));
}

export async function getDashboard(env: Env): Promise<DashboardResponse> {
  await ensureSeedData(env);
  const [portfolios, holdings, latestDecision, recentMessages, research, meetings, reviews, sourceHealth, halted] = await Promise.all([
    getPortfolios(env),
    getHoldings(env),
    getLatestDecision(env),
    getRecentMessages(env, 30),
    env.DB.prepare("SELECT * FROM research_tasks ORDER BY priority ASC, id DESC LIMIT 30").all(),
    env.DB.prepare("SELECT * FROM meetings ORDER BY id DESC LIMIT 10").all(),
    env.DB.prepare("SELECT * FROM loss_reviews ORDER BY id DESC LIMIT 10").all(),
    env.DB.prepare("SELECT * FROM source_health ORDER BY source_name").all(),
    getSetting(env, "system_halted", "false")
  ]);

  return {
    generatedAt: isoNow(),
    status: {
      appMode: env.APP_MODE,
      liveTradingEnabled: env.LIVE_TRADING_ENABLED !== "false",
      halted: halted === "true",
      aiEnabled: env.AI_ENABLED === "true"
    },
    portfolios,
    holdings,
    latestDecision,
    recentMessages,
    researchTasks: research.results ?? [],
    recentMeetings: meetings.results ?? [],
    recentLossReviews: reviews.results ?? [],
    sourceHealth: sourceHealth.results ?? []
  };
}

export async function storeDecision(env: Env, decision: CouncilDecision): Promise<number> {
  const result = await env.DB.prepare(
    `INSERT INTO decisions
     (strategy, symbol, verdict, confidence, fact_veto, risk_veto, allocation_pct, summary, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    decision.candidate.strategy,
    decision.candidate.symbol,
    decision.verdict,
    decision.confidence,
    decision.factVeto ? 1 : 0,
    decision.riskVeto ? 1 : 0,
    decision.allocationPct,
    decision.summary,
    JSON.stringify(decision),
    decision.createdAt
  ).run();

  const id = Number(result.meta.last_row_id ?? 0);
  if (decision.messages.length) {
    await env.DB.batch(decision.messages.map((message) =>
      env.DB.prepare(
        `INSERT INTO agent_messages
         (decision_id, agent, department, role, text, confidence, evidence_statuses_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        message.agent,
        message.department,
        message.role,
        message.text,
        message.confidence,
        JSON.stringify(message.evidenceStatuses),
        message.createdAt
      )
    ));
  }
  return id;
}
