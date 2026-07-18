export type Verdict =
  | "STRONG BUY"
  | "BUY"
  | "SMALL TEST POSITION"
  | "WATCH"
  | "WAIT FOR BETTER PRICE"
  | "HOLD"
  | "REDUCE"
  | "SELL"
  | "REJECT"
  | "INSUFFICIENT EVIDENCE";

export type StrategyId = "congress" | "news" | "whales" | "quant" | "consensus";

export interface Env {
  DB: D1Database;
  AI?: Ai;
  ASSETS?: Fetcher;
  APP_ENV: string;
  APP_MODE: string;
  LIVE_TRADING_ENABLED: string;
  ALLOWED_ORIGIN: string;
  AI_ENABLED: string;
  AI_MODEL: string;
  MARKET_PROVIDER: string;
  SEC_USER_AGENT: string;
  MAX_AI_CALLS_PER_CYCLE: string;
  ADMIN_TOKEN?: string;
  TWELVE_DATA_API_KEY?: string;
  ALPHA_VANTAGE_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  changePct: number;
  timestamp: string;
  source: string;
  delayed: boolean;
}

export interface EvidenceItem {
  id?: number;
  sourceType: string;
  sourceName: string;
  url?: string;
  title: string;
  publishedAt?: string;
  retrievedAt: string;
  trustTier: number;
  status: "VERIFIED" | "UNVERIFIED" | "STALE" | "CONTRADICTED" | "ASSUMPTION";
  summary: string;
  symbol?: string;
  raw?: unknown;
}

export interface Candidate {
  strategy: StrategyId;
  symbol: string;
  proposedAction: "BUY" | "SELL" | "HOLD";
  headline: string;
  rationale: string;
  signalStrength: number;
  sourceAgeDays: number;
  factCompleteness: number;
  eventRisk: number;
  priceChangePct: number;
  evidence: EvidenceItem[];
  metadata: Record<string, unknown>;
}

export interface AgentMessage {
  agent: string;
  department: string;
  role: string;
  text: string;
  confidence: number;
  evidenceStatuses: string[];
  createdAt: string;
}

export interface CouncilDecision {
  id?: number;
  candidate: Candidate;
  verdict: Verdict;
  bullScore: number;
  bearScore: number;
  factScore: number;
  confidence: number;
  riskScore: number;
  allocationPct: number;
  summary: string;
  factVeto: boolean;
  riskVeto: boolean;
  messages: AgentMessage[];
  createdAt: string;
}

export interface Portfolio {
  strategy: StrategyId;
  name: string;
  startingCash: number;
  cash: number;
  value: number;
  realisedPnl: number;
  halted: boolean;
}

export interface Holding {
  id: number;
  strategy: StrategyId;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  openedAt: string;
  thesis: string;
}

export interface RiskResult {
  passed: boolean;
  score: number;
  allocationPct: number;
  reasons: string[];
}

export interface DashboardResponse {
  generatedAt: string;
  status: {
    appMode: string;
    liveTradingEnabled: boolean;
    halted: boolean;
    aiEnabled: boolean;
  };
  portfolios: Array<Portfolio & { positions: number; returnPct: number }>;
  holdings: Holding[];
  latestDecision: CouncilDecision | null;
  recentMessages: AgentMessage[];
  researchTasks: unknown[];
  recentMeetings: unknown[];
  recentLossReviews: unknown[];
  sourceHealth: unknown[];
}
