PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  starting_cash REAL NOT NULL,
  cash REAL NOT NULL,
  value REAL NOT NULL,
  realised_pnl REAL NOT NULL DEFAULT 0,
  halted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  url TEXT,
  title TEXT NOT NULL,
  published_at TEXT,
  retrieved_at TEXT NOT NULL,
  trust_tier INTEGER NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  symbol TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_evidence_symbol ON evidence(symbol, trust_tier, published_at);

CREATE TABLE IF NOT EXISTS research_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  priority TEXT NOT NULL,
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  verdict TEXT NOT NULL,
  confidence REAL NOT NULL,
  fact_veto INTEGER NOT NULL DEFAULT 0,
  risk_veto INTEGER NOT NULL DEFAULT 0,
  allocation_pct REAL NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decisions_strategy_time ON decisions(strategy, created_at DESC);

CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_type TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER,
  meeting_id INTEGER,
  agent TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  confidence REAL NOT NULL,
  evidence_statuses_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(decision_id) REFERENCES decisions(id),
  FOREIGN KEY(meeting_id) REFERENCES meetings(id)
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON agent_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS paper_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  quantity REAL NOT NULL,
  reference_price REAL NOT NULL,
  notional REAL NOT NULL,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  filled_at TEXT,
  FOREIGN KEY(decision_id) REFERENCES decisions(id)
);

CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  quantity REAL NOT NULL,
  average_price REAL NOT NULL,
  current_price REAL NOT NULL,
  sector TEXT NOT NULL DEFAULT 'UNKNOWN',
  status TEXT NOT NULL DEFAULT 'OPEN',
  thesis TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_open_holding_unique
  ON holdings(strategy, symbol) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS loss_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  holding_id INTEGER NOT NULL,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  pnl_pct REAL NOT NULL,
  classification TEXT NOT NULL,
  questions_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  closed_at TEXT,
  FOREIGN KEY(holding_id) REFERENCES holdings(id)
);

CREATE TABLE IF NOT EXISTS improvement_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  status TEXT NOT NULL,
  backtest_result_json TEXT NOT NULL,
  user_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL,
  last_success_at TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS congress_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  politician TEXT NOT NULL,
  owner TEXT NOT NULL,
  symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  transaction_date TEXT NOT NULL,
  disclosure_date TEXT NOT NULL,
  amount_min REAL,
  amount_max REAL,
  official_url TEXT,
  payload_json TEXT NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS institutional_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  filing_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trader_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trader_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  broker_verified INTEGER NOT NULL DEFAULT 0,
  signal_time TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trader_signals_recent ON trader_signals(signal_time DESC, verified);
