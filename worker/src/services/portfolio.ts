import type { CouncilDecision, Env, MarketQuote, Portfolio, StrategyId } from "../types";
import { isoNow } from "../utils";

export async function getPortfolio(env: Env, strategy: StrategyId): Promise<Portfolio> {
  const row = await env.DB.prepare(
    `SELECT strategy, name, starting_cash AS startingCash, cash, value,
            realised_pnl AS realisedPnl, halted
     FROM portfolios WHERE strategy = ?`
  ).bind(strategy).first<Record<string, unknown>>();
  if (!row) throw new Error(`Portfolio ${strategy} was not found.`);
  return {
    strategy,
    name: String(row.name),
    startingCash: Number(row.startingCash),
    cash: Number(row.cash),
    value: Number(row.value),
    realisedPnl: Number(row.realisedPnl),
    halted: Boolean(row.halted)
  };
}

export async function countOpenPositions(env: Env, strategy: StrategyId): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM holdings WHERE strategy = ? AND status = 'OPEN'"
  ).bind(strategy).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function createPaperOrder(env: Env, decisionId: number, decision: CouncilDecision, quote: MarketQuote): Promise<number> {
  const portfolio = await getPortfolio(env, decision.candidate.strategy);
  const notional = Math.min(
    portfolio.value * (decision.allocationPct / 100),
    portfolio.cash - portfolio.value * 0.2
  );
  if (notional <= 0 || quote.price <= 0) throw new Error("Paper order has invalid notional or price.");
  const quantity = notional / quote.price;
  const now = isoNow();

  const result = await env.DB.prepare(
    `INSERT INTO paper_orders
     (decision_id, strategy, symbol, side, quantity, reference_price, notional,
      status, reason, created_at, filled_at)
     VALUES (?, ?, ?, 'BUY', ?, ?, ?, 'FILLED', ?, ?, ?)`
  ).bind(
    decisionId,
    decision.candidate.strategy,
    decision.candidate.symbol,
    quantity,
    quote.price,
    notional,
    "Council and hard risk manager approved paper execution.",
    now,
    now
  ).run();

  const existing = await env.DB.prepare(
    `SELECT id, quantity, average_price AS averagePrice FROM holdings
     WHERE strategy = ? AND symbol = ? AND status = 'OPEN'`
  ).bind(decision.candidate.strategy, decision.candidate.symbol).first<{ id: number; quantity: number; averagePrice: number }>();

  if (existing) {
    const combinedQuantity = Number(existing.quantity) + quantity;
    const combinedCost = Number(existing.quantity) * Number(existing.averagePrice) + notional;
    await env.DB.prepare(
      `UPDATE holdings SET quantity = ?, average_price = ?, current_price = ?, updated_at = ? WHERE id = ?`
    ).bind(combinedQuantity, combinedCost / combinedQuantity, quote.price, now, existing.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO holdings
       (strategy, symbol, quantity, average_price, current_price, sector, status, thesis, opened_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?)`
    ).bind(
      decision.candidate.strategy,
      decision.candidate.symbol,
      quantity,
      quote.price,
      quote.price,
      String(decision.candidate.metadata.sector ?? "UNKNOWN"),
      decision.summary,
      now,
      now
    ).run();
  }

  await env.DB.prepare(
    `UPDATE portfolios SET cash = cash - ?, value = value, updated_at = ? WHERE strategy = ?`
  ).bind(notional, now, decision.candidate.strategy).run();

  return Number(result.meta.last_row_id ?? 0);
}

export async function markHoldings(env: Env, quotes: MarketQuote[]): Promise<void> {
  const now = isoNow();
  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const holdings = await env.DB.prepare(
    `SELECT id, strategy, symbol, quantity, average_price AS averagePrice, current_price AS currentPrice
     FROM holdings WHERE status = 'OPEN'`
  ).all<Record<string, unknown>>();

  const updates: D1PreparedStatement[] = [];
  for (const holding of holdings.results ?? []) {
    const quote = quoteMap.get(String(holding.symbol));
    if (!quote || quote.price <= 0) continue;
    updates.push(env.DB.prepare(
      `UPDATE holdings SET current_price = ?, updated_at = ? WHERE id = ?`
    ).bind(quote.price, now, holding.id));
  }
  if (updates.length) await env.DB.batch(updates);

  const strategies = ["congress", "news", "whales", "quant", "consensus"] as const;
  for (const strategy of strategies) {
    await env.DB.prepare(
      `UPDATE portfolios
       SET value = cash + COALESCE((
         SELECT SUM(quantity * current_price) FROM holdings
         WHERE holdings.strategy = portfolios.strategy AND status = 'OPEN'
       ), 0), updated_at = ?
       WHERE strategy = ?`
    ).bind(now, strategy).run();
  }
}
