"use strict";

const APP_VERSION = "3.0.0";
const STARTING_VALUE = 1150;
const MEETING_INTERVAL_SECONDS = 30 * 60;

const pageMeta = {
  command: ["SYSTEM OVERVIEW // 概要", "Command Centre"],
  congress: ["POLITICAL INTELLIGENCE // 政治", "Congress Intelligence"],
  news: ["EVENT INTELLIGENCE // 速報", "News & Catalysts"],
  whales: ["CAPITAL FLOW // 資本", "Whales & Insiders"],
  quant: ["SYSTEMATIC RESEARCH // 数量", "Quant Intelligence"],
  consensus: ["TRADER CONSENSUS // 合意", "Top 10 Consensus"],
  chamber: ["COUNCIL OPERATIONS // 会議", "Council Chamber"],
  conversations: ["AGENT NETWORK // 対話", "Agent Conversations"],
  research: ["RESEARCH OPERATIONS // 調査", "Research Queue"],
  timeline: ["DECISION MEMORY // 記録", "Decision Timeline"],
  holdings: ["PAPER PORTFOLIO // 保有", "Holdings"],
  performance: ["MODEL EVALUATION // 成績", "Performance Lab"],
  loss: ["POST-TRADE REVIEW // 反省", "Loss Review"],
  learning: ["SYSTEM IMPROVEMENT // 学習", "Meta-Learning"],
  sources: ["EVIDENCE CONTROL // 証拠", "Sources & Evidence"],
  risk: ["GOVERNANCE // 制御", "Risk Controls"]
};

const agentColours = {
  "DEEP PATTERN ANALYST": "#79ceff",
  "DIVERGENT EXPLORER": "#af92ff",
  "CONSERVATIVE REALIST": "#ffd36c",
  "PRACTICAL STRATEGIST": "#49e6a4",
  "TECHNICAL ANALYST": "#79ceff",
  "FUNDAMENTAL ANALYST": "#49e6a4",
  "MACRO ANALYST": "#af92ff",
  "NEWS ANALYST": "#ff81d8",
  "BULL ANALYST": "#49e6a4",
  "BEAR ANALYST": "#ff6f7d",
  "FACT CHECKER": "#79ceff",
  "FRAUD AUDITOR": "#ff6f7d",
  "LIQUIDITY ANALYST": "#ffd36c",
  "PORTFOLIO ANALYST": "#af92ff",
  "FINAL JUDGE": "#f0f8ff",
  "RISK MANAGER": "#ff6f7d",
  "PERFORMANCE SCIENTIST": "#79ceff",
  "BIAS DETECTOR": "#af92ff",
  "IMPROVEMENT JUDGE": "#49e6a4"
};

const state = {
  halted: false,
  mode: "approval",
  meetingSeconds: MEETING_INTERVAL_SECONDS,
  latestDecision: null,
  pendingDecision: null,
  cycle: 0,
  portfolios: [
    {
      id: "congress",
      code: "POL-INT",
      name: "Congress Intelligence",
      description: "Public disclosures, committees, policy exposure and government catalysts.",
      value: STARTING_VALUE,
      cash: STARTING_VALUE,
      returnPct: 0,
      positions: 0,
      accent: "#79ceff"
    },
    {
      id: "news",
      code: "CAT-NEWS",
      name: "News & Catalysts",
      description: "Earnings, contracts, regulation, launches, lawsuits and breaking events.",
      value: STARTING_VALUE,
      cash: STARTING_VALUE,
      returnPct: 0,
      positions: 0,
      accent: "#49e6a4"
    },
    {
      id: "whales",
      code: "WHALE-13F",
      name: "Whales & Insiders",
      description: "Institutions, executives, directors and famous-investor activity.",
      value: STARTING_VALUE,
      cash: STARTING_VALUE,
      returnPct: 0,
      positions: 0,
      accent: "#af92ff"
    },
    {
      id: "quant",
      code: "QNT-MOM",
      name: "Quant Intelligence",
      description: "Momentum, volume, volatility, correlation and market regime.",
      value: STARTING_VALUE,
      cash: STARTING_VALUE,
      returnPct: 0,
      positions: 0,
      accent: "#ffd36c"
    },
    {
      id: "consensus",
      code: "T10-CNS",
      name: "Top 10 Consensus",
      description: "Risk-adjusted trader ranking, verified agreement and entry review.",
      value: STARTING_VALUE,
      cash: STARTING_VALUE,
      returnPct: 0,
      positions: 0,
      accent: "#ff81d8"
    }
  ],
  holdings: [],
  activity: [
    "Autopilot Council V3 browser interface initialised.",
    "No real prices, AI backend, broker credentials or live orders are connected.",
    "Fact Checker and Risk Manager veto authority enabled.",
    "Thirty-minute council timer started."
  ],
  decisions: [],
  lossReviews: [],
  improvementProposals: [
    {
      title: "Separate stale-data penalties by strategy",
      owner: "Bias Detector",
      status: "Shadow Test",
      detail: "Congress and institutional filings should not use the same freshness threshold as breaking news."
    },
    {
      title: "Add entry-quality score before consensus trades",
      owner: "Performance Scientist",
      status: "Proposed",
      detail: "Trader agreement should not override poor liquidity, valuation or recent price spikes."
    },
    {
      title: "Require primary-source confirmation for major catalysts",
      owner: "Data Quality Researcher",
      status: "Approved",
      detail: "Major news trades must include an official filing or company announcement."
    }
  ],
  conversations: []
};

const candidateLibrary = [
  {
    department: "Congress Intelligence",
    portfolioId: "congress",
    symbol: "MSFT",
    headline: "Delayed public purchase disclosure with possible government-cloud exposure",
    verdict: "WATCH",
    bull: 77,
    bear: 55,
    facts: 91,
    confidence: 74,
    risk: 80,
    allocationPct: 0,
    sourceTags: ["OFFICIAL DISCLOSURE", "PRICE DATA NEEDED", "STALE"],
    summary:
      "The political signal is credible, but the original transaction is delayed and current entry quality is not strong enough. Keep on watch and compare price movement since the transaction date."
  },
  {
    department: "News & Catalysts",
    portfolioId: "news",
    symbol: "NVDA",
    headline: "Confirmed infrastructure partnership with controlled price reaction",
    verdict: "BUY",
    bull: 87,
    bear: 43,
    facts: 95,
    confidence: 89,
    risk: 85,
    allocationPct: 5,
    sourceTags: ["PRIMARY SOURCE", "CONFIRMED", "CURRENT"],
    summary:
      "Two strong evidence layers support the catalyst. The price has not moved far enough to invalidate entry quality, and risk rules approve a small paper position."
  },
  {
    department: "Whales & Insiders",
    portfolioId: "whales",
    symbol: "JPM",
    headline: "Institutional accumulation confirmed across multiple delayed filings",
    verdict: "SMALL TEST POSITION",
    bull: 75,
    bear: 57,
    facts: 88,
    confidence: 72,
    risk: 78,
    allocationPct: 5,
    sourceTags: ["OFFICIAL FILING", "DELAYED", "MULTI-SOURCE"],
    summary:
      "The signal is delayed but broad-based. A small paper position is allowed because the long-term thesis is supported and the portfolio has sufficient cash."
  },
  {
    department: "Quant Intelligence",
    portfolioId: "quant",
    symbol: "META",
    headline: "Trend, relative strength and volume regime align",
    verdict: "BUY",
    bull: 83,
    bear: 39,
    facts: 98,
    confidence: 90,
    risk: 88,
    allocationPct: 5,
    sourceTags: ["PRICE DATA", "VOLUME DATA", "VERIFIED"],
    summary:
      "The numerical setup is strong, but the position remains capped because correlated technology exposure can rise quickly."
  },
  {
    department: "Top 10 Consensus",
    portfolioId: "consensus",
    symbol: "AAPL",
    headline: "Eight of ten top-ranked simulated traders agree on a purchase",
    verdict: "REJECT",
    bull: 68,
    bear: 76,
    facts: 93,
    confidence: 84,
    risk: 62,
    allocationPct: 0,
    sourceTags: ["8/10 AGREEMENT", "ENTRY RISK", "SIMULATED"],
    summary:
      "Consensus is not enough. The Bear Analyst identifies weak entry timing and the Risk Manager rejects the paper order."
  },
  {
    department: "News & Catalysts",
    portfolioId: "news",
    symbol: "LLY",
    headline: "Regulatory development may expand commercial opportunity",
    verdict: "WAIT FOR BETTER PRICE",
    bull: 81,
    bear: 61,
    facts: 90,
    confidence: 75,
    risk: 70,
    allocationPct: 0,
    sourceTags: ["REGULATORY", "CONFIRMED", "PRICE EXTENDED"],
    summary:
      "The catalyst is real, but the current simulated entry is extended. Add to the research queue and reassess after price normalisation."
  }
];

const meetingScript = [
  {
    agent: "DEEP PATTERN ANALYST",
    text: "Across the departments, stale information performs better when the market has not already repriced the event. Delay alone should not decide the verdict.",
    evidence: ["PATTERN HISTORY", "ASSUMPTION"]
  },
  {
    agent: "DIVERGENT EXPLORER",
    text: "Direct beneficiaries may already be expensive. The research queue should include suppliers, competitors and second-order sector effects.",
    evidence: ["SECOND-ORDER", "UNVERIFIED"]
  },
  {
    agent: "CONSERVATIVE REALIST",
    text: "Every department is generating interesting ideas, but opportunity quality is not the same as entry quality. Doing nothing remains a valid decision.",
    evidence: ["RISK", "VERIFIED"]
  },
  {
    agent: "BULL ANALYST",
    text: "The strongest current opportunities combine confirmed catalysts, controlled price movement and multiple evidence layers.",
    evidence: ["MULTI-SOURCE", "CURRENT"]
  },
  {
    agent: "BEAR ANALYST",
    text: "Recent winners are at risk of chasing. Consensus and political activity can both become crowded or stale signals.",
    evidence: ["TIMING RISK", "VERIFIED"]
  },
  {
    agent: "FACT CHECKER",
    text: "Primary-source requirements are working. Three lower-quality claims remain marked as unverified and cannot support orders.",
    evidence: ["PRIMARY SOURCE", "VERIFIED"]
  },
  {
    agent: "PORTFOLIO ANALYST",
    text: "Technology correlation is rising across News, Quant and Consensus portfolios. New exposure should be capped until diversification improves.",
    evidence: ["CORRELATION", "PORTFOLIO"]
  },
  {
    agent: "FINAL JUDGE",
    text: "Keep the current risk limits. Approve only candidates with verified evidence, acceptable entry quality and sufficient portfolio capacity.",
    evidence: ["FINAL VERDICT"]
  },
  {
    agent: "IMPROVEMENT JUDGE",
    text: "Propose a shadow test for strategy-specific freshness thresholds. Do not change production rules until the backtest and user approval are complete.",
    evidence: ["META-LEARNING", "GOVERNANCE"]
  }
];

const departmentInfo = {
  congress: {
    title: "Congress Intelligence",
    description:
      "Monitors public politician, spouse and dependent transactions. It compares disclosure delay, committee exposure, policy developments, current price movement and estimated historical performance.",
    metrics: [
      ["DISCLOSURES", "24"],
      ["HIGH-PRIORITY", "6"],
      ["AVG DELAY", "21D"],
      ["VERIFIED", "87%"]
    ],
    headers: ["Source", "Ticker", "Action", "Delay", "Policy Link", "Status"],
    rows: [
      ["Sample Member A", "MSFT", "Purchase", "11 days", "Cloud spending", "Researching"],
      ["Sample Member B", "AAPL", "Purchase", "18 days", "None confirmed", "Watch"],
      ["Sample Spouse C", "AMZN", "Purchase", "37 days", "Procurement", "Stale"],
      ["Sample Member D", "NVDA", "Sale", "29 days", "AI regulation", "Verified"]
    ],
    rules: [
      ["Monitor all disclosed purchases and sales", "ACTIVE"],
      ["Prioritise strong estimated histories", "ACTIVE"],
      ["Reject penny stocks and illiquid names", "ACTIVE"],
      ["Old disclosures judged by remaining opportunity", "ACTIVE"]
    ]
  },
  news: {
    title: "News & Catalysts",
    description:
      "Evaluates earnings, guidance, contracts, acquisitions, product launches, regulatory approvals, lawsuits, management changes, insider buying, analyst revisions and global political or economic events.",
    metrics: [
      ["EVENTS SCANNED", "128"],
      ["PRIMARY SOURCES", "34"],
      ["ACTIVE DEBATES", "8"],
      ["REJECTED RUMOURS", "19"]
    ],
    headers: ["Ticker", "Event", "Source Tier", "Age", "Classification", "Status"],
    rows: [
      ["NVDA", "Infrastructure partnership", "Primary", "1h", "Confirmed", "Debating"],
      ["LLY", "Regulatory update", "Government", "3h", "Confirmed", "Verifying"],
      ["GOOGL", "Cloud demand report", "Major news", "5h", "Current", "Researching"],
      ["TSLA", "Delivery rumour", "Social lead", "20m", "Unverified", "Blocked"]
    ],
    rules: [
      ["Every event category enabled", "ACTIVE"],
      ["Social media used only as a lead", "ACTIVE"],
      ["Primary source plus confirmation for major trades", "ACTIVE"],
      ["Already-priced-in test required", "ACTIVE"]
    ]
  },
  whales: {
    title: "Whales & Insiders",
    description:
      "Tracks institutions, hedge funds, directors, executives and famous investors separately. It evaluates new positions, increases, reductions, exits, agreement, filing age and changes in fundamentals.",
    metrics: [
      ["13F SIGNALS", "44"],
      ["INSIDER EVENTS", "17"],
      ["FAMOUS INVESTORS", "12"],
      ["MULTI-BUY SIGNALS", "7"]
    ],
    headers: ["Source Type", "Ticker", "Signal", "Age", "Confidence", "Status"],
    rows: [
      ["Institutional", "JPM", "Increase", "24 days", "76", "Verified"],
      ["Insider", "META", "Purchase", "3 days", "82", "Researching"],
      ["Famous Investor", "XOM", "Increase", "31 days", "69", "Watch"],
      ["Institutional", "MSFT", "Maintain", "38 days", "61", "Low Priority"]
    ],
    rules: [
      ["Institutions, insiders and individuals separated", "ACTIVE"],
      ["Exact timing uncertainty penalised", "ACTIVE"],
      ["Multi-investor agreement increases confidence", "ACTIVE"],
      ["Long-term thesis review before exit", "ACTIVE"]
    ]
  },
  quant: {
    title: "Quant Intelligence",
    description:
      "Uses trend, price momentum, volume, volatility, relative strength, moving averages, support and resistance, market regime, sector strength, correlation, drawdown and entry quality.",
    metrics: [
      ["SYMBOLS SCANNED", "850"],
      ["CANDIDATES", "14"],
      ["MARKET REGIME", "MIXED"],
      ["AVG SIGNAL", "72"]
    ],
    headers: ["Ticker", "Momentum", "Volume", "Volatility", "Regime", "Status"],
    rows: [
      ["META", "82", "Strong", "Medium", "Bullish", "Candidate"],
      ["MSFT", "76", "Normal", "Low", "Bullish", "Watch"],
      ["TSLA", "69", "Strong", "High", "Mixed", "Rejected"],
      ["SPY", "61", "Normal", "Low", "Neutral", "Benchmark"]
    ],
    rules: [
      ["Fast numerical pipeline", "ACTIVE"],
      ["Fixed and trailing stops", "ACTIVE"],
      ["Correlation and sector exposure checks", "ACTIVE"],
      ["Extreme market regime can halt entries", "ACTIVE"]
    ]
  },
  consensus: {
    title: "Top 10 Consensus",
    description:
      "Ranks verified trader profiles using risk-adjusted returns, drawdown, consistency, win/loss ratio, number of trades, track-record length and performance across market conditions.",
    metrics: [
      ["TRACKED TRADERS", "38"],
      ["VERIFIED TOP 10", "10"],
      ["ACTIVE AGREEMENTS", "4"],
      ["MINIMUM BUY", "7/10"]
    ],
    headers: ["Ticker", "Buy", "Sell", "Hold", "Agreement", "Status"],
    rows: [
      ["MSFT", "9", "0", "1", "Strong", "Candidate"],
      ["AAPL", "8", "1", "1", "Standard", "Review"],
      ["META", "10", "0", "0", "Unanimous", "Fact Check"],
      ["TSLA", "6", "3", "1", "Below Threshold", "Rejected"]
    ],
    rules: [
      ["7/10 normal candidate", "ACTIVE"],
      ["8/10 stronger candidate", "ACTIVE"],
      ["9/10 high-confidence candidate", "ACTIVE"],
      ["10/10 unanimous candidate", "ACTIVE"],
      ["Full council still required", "ACTIVE"]
    ]
  }
};

const researchTasks = [
  ["P1", "News", "Verify official NVDA announcement and remaining entry quality", "VERIFYING"],
  ["P1", "Congress", "Compare MSFT transaction date with current price movement", "RESEARCHING"],
  ["P1", "Whales", "Confirm whether JPM accumulation is broad or fund-specific", "RESEARCHING"],
  ["P2", "Quant", "Recalculate technology-sector correlation", "QUEUED"],
  ["P2", "Consensus", "Validate top-trader track records and trade timestamps", "QUEUED"],
  ["P2", "Macro", "Assess rate sensitivity across financial holdings", "QUEUED"],
  ["P3", "Meta-Learning", "Backtest strategy-specific stale-data penalties", "SHADOW TEST"],
  ["P3", "Sources", "Re-rank specialist publications by historical accuracy", "PROPOSED"]
];

const sourceHierarchy = [
  ["TIER 1", "Official company filings and announcements", "PRIMARY", "Can verify decisions"],
  ["TIER 1", "Government and regulatory sources", "PRIMARY", "Can verify decisions"],
  ["TIER 2", "Major financial news organisations", "HIGH", "Requires primary confirmation for large trades"],
  ["TIER 3", "Established specialist publications", "MEDIUM", "Useful confirmation"],
  ["TIER 4", "Analyst commentary", "LEAD", "Must be independently checked"],
  ["TIER 5", "Social media and forums", "LEAD ONLY", "Cannot verify a trade"]
];

const riskControls = [
  ["Normal paper position", "5%"],
  ["Strong paper position", "8%"],
  ["Exceptional paper position", "10%"],
  ["Absolute maximum per stock", "10%"],
  ["Daily paper loss limit", "2%"],
  ["Weekly paper loss limit", "5%"],
  ["Maximum portfolio drawdown", "10%"],
  ["Maximum sector exposure", "30%"],
  ["Highly correlated holdings", "3"],
  ["Minimum cash reserve", "20%"],
  ["Penny stocks", "BLOCKED"],
  ["Leverage", "BLOCKED"],
  ["Options", "BLOCKED"],
  ["Short selling", "BLOCKED"],
  ["Unverified trade evidence", "BLOCKED"],
  ["Live trading", "BLOCKED"]
];

function nowTime() {
  return new Date().toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function money(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function pct(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function saveState() {
  const snapshot = {
    mode: state.mode,
    portfolios: state.portfolios,
    holdings: state.holdings,
    activity: state.activity.slice(0, 50),
    decisions: state.decisions.slice(0, 50),
    lossReviews: state.lossReviews.slice(0, 25),
    improvementProposals: state.improvementProposals
  };
  localStorage.setItem("autopilotCouncilV3", JSON.stringify(snapshot));
}

function loadState() {
  const raw = localStorage.getItem("autopilotCouncilV3");
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    if (saved.mode === "approval" || saved.mode === "autopilot") {
      state.mode = saved.mode;
    }
    if (Array.isArray(saved.portfolios) && saved.portfolios.length === state.portfolios.length) {
      state.portfolios = saved.portfolios;
    }
    if (Array.isArray(saved.holdings)) state.holdings = saved.holdings;
    if (Array.isArray(saved.activity)) state.activity = saved.activity;
    if (Array.isArray(saved.decisions)) state.decisions = saved.decisions;
    if (Array.isArray(saved.lossReviews)) state.lossReviews = saved.lossReviews;
    if (Array.isArray(saved.improvementProposals)) {
      state.improvementProposals = saved.improvementProposals;
    }
  } catch (error) {
    console.warn("Could not load saved demo state:", error);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

function addActivity(message) {
  state.activity.unshift(message);
  state.activity = state.activity.slice(0, 50);
  renderActivity();
}

function renderPortfolios() {
  const grid = document.getElementById("portfolio-grid");

  grid.innerHTML = state.portfolios.map((portfolio) => {
    const progress = Math.max(3, Math.min(100, 50 + portfolio.returnPct * 4));
    return `
      <article class="portfolio-card" style="--accent:${portfolio.accent}">
        <div class="portfolio-card-top">
          <span class="portfolio-code">${escapeHtml(portfolio.code)}</span>
          <span class="status-tag status-approved">ACTIVE</span>
        </div>
        <h4>${escapeHtml(portfolio.name)}</h4>
        <p class="portfolio-description">${escapeHtml(portfolio.description)}</p>
        <p class="portfolio-value">${money(portfolio.value)}</p>
        <p class="portfolio-return">${money(portfolio.value - STARTING_VALUE)} (${pct(portfolio.returnPct)})</p>
        <div class="progress-track">
          <div class="progress-value" style="width:${progress}%"></div>
        </div>
        <div class="portfolio-footer">
          <span>POSITIONS ${portfolio.positions}</span>
          <span>CASH ${money(portfolio.cash)}</span>
        </div>
      </article>
    `;
  }).join("");

  const combined = state.portfolios.reduce((sum, portfolio) => sum + portfolio.value, 0);
  const startingCombined = STARTING_VALUE * state.portfolios.length;
  const combinedReturn = ((combined - startingCombined) / startingCombined) * 100;
  const positions = state.portfolios.reduce((sum, portfolio) => sum + portfolio.positions, 0);
  const totalCash = state.portfolios.reduce((sum, portfolio) => sum + portfolio.cash, 0);
  const cashReserve = combined > 0 ? (totalCash / combined) * 100 : 100;

  document.getElementById("combined-value").textContent = money(combined);
  document.getElementById("combined-return").textContent =
    `${money(combined - startingCombined)} (${pct(combinedReturn)})`;
  document.getElementById("position-count").textContent = positions;
  document.getElementById("cash-reserve").textContent = `${cashReserve.toFixed(0)}%`;
  document.getElementById("task-count").textContent = researchTasks.length;
}

function renderActivity() {
  const feed = document.getElementById("activity-feed");
  const current = Date.now();

  feed.innerHTML = state.activity.slice(0, 10).map((message, index) => {
    const stamp = new Date(current - index * 61_000);
    return `
      <div class="activity-item">
        <span class="activity-time">${stamp.toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })}</span>
        <span class="activity-copy">${escapeHtml(message)}</span>
      </div>
    `;
  }).join("");
}

function renderLatestDecision() {
  const decision = state.latestDecision;
  const approveButton = document.getElementById("approve-button");
  const rejectButton = document.getElementById("reject-button");

  if (!decision) {
    approveButton.disabled = true;
    rejectButton.disabled = true;
    return;
  }

  document.getElementById("verdict-title").textContent =
    `${decision.department} → ${decision.symbol}`;
  document.getElementById("bull-score").textContent = decision.bull;
  document.getElementById("bear-score").textContent = decision.bear;
  document.getElementById("fact-score").textContent = decision.facts;
  document.getElementById("confidence-score").textContent = decision.confidence;
  document.getElementById("risk-score").textContent = decision.risk;
  document.getElementById("verdict-copy").textContent = decision.summary;

  const status = document.getElementById("verdict-status");
  status.textContent = decision.verdict;
  const buyingVerdicts = ["BUY", "SMALL TEST POSITION", "STRONG BUY"];
  status.className =
    `status-tag ${
      buyingVerdicts.includes(decision.verdict)
        ? "status-buy"
        : decision.verdict === "REJECT"
          ? "status-reject"
          : "status-waiting"
    }`;

  const canBuy =
    buyingVerdicts.includes(decision.verdict) &&
    decision.allocationPct > 0 &&
    !state.halted;

  approveButton.disabled = !canBuy || state.mode === "autopilot";
  rejectButton.disabled = !canBuy || state.mode === "autopilot";

  if (state.mode === "approval" && canBuy) {
    state.pendingDecision = decision;
  } else {
    state.pendingDecision = null;
  }
}

function createHolding(decision) {
  const portfolio = state.portfolios.find((item) => item.id === decision.portfolioId);
  if (!portfolio) return;

  const allocation = Math.min(
    portfolio.value * (decision.allocationPct / 100),
    portfolio.cash - portfolio.value * 0.2
  );

  if (allocation < 10) {
    addActivity(`${portfolio.name}: risk layer blocked ${decision.symbol} because cash reserve would be too low.`);
    return;
  }

  const existing = state.holdings.find(
    (holding) =>
      holding.portfolioId === portfolio.id &&
      holding.symbol === decision.symbol
  );

  if (existing) {
    existing.value += allocation;
    existing.cost += allocation;
  } else {
    state.holdings.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      portfolioId: portfolio.id,
      portfolio: portfolio.name,
      symbol: decision.symbol,
      value: allocation,
      cost: allocation,
      pnlPct: 0,
      thesis: decision.summary,
      openedAt: new Date().toISOString()
    });
    portfolio.positions += 1;
  }

  portfolio.cash -= allocation;
  addActivity(`${portfolio.name}: simulated BUY ${money(allocation)} of ${decision.symbol}.`);
  state.pendingDecision = null;
  saveState();
  renderAll();
}

function updateHoldingMarks() {
  const lossEvents = [];

  state.holdings.forEach((holding) => {
    const move = (Math.random() - 0.46) * 1.15;
    holding.value = Math.max(1, holding.value * (1 + move / 100));
    holding.pnlPct = ((holding.value - holding.cost) / holding.cost) * 100;

    if (holding.pnlPct <= -2.3 && !holding.lossReviewCreated) {
      holding.lossReviewCreated = true;
      lossEvents.push(holding);
    }
  });

  state.portfolios.forEach((portfolio) => {
    const holdingValue = state.holdings
      .filter((holding) => holding.portfolioId === portfolio.id)
      .reduce((sum, holding) => sum + holding.value, 0);

    portfolio.value = portfolio.cash + holdingValue;
    portfolio.returnPct = ((portfolio.value - STARTING_VALUE) / STARTING_VALUE) * 100;
  });

  lossEvents.forEach((holding) => createImmediateLossReview(holding));
}

function createImmediateLossReview(holding) {
  const review = {
    id: Date.now(),
    symbol: holding.symbol,
    portfolio: holding.portfolio,
    lossPct: holding.pnlPct,
    classification: "POOR TIMING — UNDER REVIEW",
    questions: [
      "What did the department predict?",
      "What actually happened?",
      "Was evidence wrong, stale or merely mistimed?",
      "Which analyst was most accurate?",
      "Did position sizing remain appropriate?",
      "Should a reasoning rule change?"
    ]
  };

  state.lossReviews.unshift(review);
  addActivity(`${holding.portfolio}: immediate loss-review meeting opened for ${holding.symbol}.`);

  state.conversations.unshift(
    {
      agent: "PERFORMANCE SCIENTIST",
      text: `${holding.symbol} moved ${holding.pnlPct.toFixed(2)}% below cost. The outcome must be separated from the quality of the original reasoning.`,
      evidence: ["LOSS REVIEW", "VERIFIED"]
    },
    {
      agent: "BIAS DETECTOR",
      text: "Check whether confirmation bias caused the team to underweight entry timing or contradictory evidence.",
      evidence: ["BIAS CHECK", "LEARNING"]
    },
    {
      agent: "IMPROVEMENT JUDGE",
      text: "Do not change production rules yet. Create a testable proposal and run it through shadow simulation.",
      evidence: ["GOVERNANCE", "SHADOW TEST"]
    }
  );
}

function simulatePortfolioMovement() {
  state.portfolios.forEach((portfolio) => {
    if (portfolio.positions === 0) return;
    const backgroundMove = (Math.random() - 0.47) * 0.35;
    portfolio.value = Math.max(100, portfolio.value * (1 + backgroundMove / 100));
  });

  updateHoldingMarks();
}

function generateConversation(decision) {
  const lines = [
    {
      agent: "DEEP PATTERN ANALYST",
      text: `For ${decision.symbol}, the most important detail is the relationship between source age, price movement and the strategy's normal holding period.`,
      evidence: ["PATTERN", decision.sourceTags[0]]
    },
    {
      agent: "DIVERGENT EXPLORER",
      text: `The direct trade may not be the only opportunity. The team should consider suppliers, competitors and second-order sector effects.`,
      evidence: ["SECOND-ORDER", "ASSUMPTION"]
    },
    {
      agent: "CONSERVATIVE REALIST",
      text: `A good story is not automatically a good entry. The current evidence must justify action now rather than simply proving that an event happened.`,
      evidence: ["ENTRY QUALITY", "RISK"]
    },
    {
      agent: "BULL ANALYST",
      text: `Bull score ${decision.bull}. The strongest positive factors are evidence quality, strategy fit and remaining potential upside.`,
      evidence: ["BULL CASE", "VERIFIED"]
    },
    {
      agent: "BEAR ANALYST",
      text: `Bear score ${decision.bear}. The largest threats are stale information, crowded positioning, valuation and the possibility that price already reflects the signal.`,
      evidence: ["BEAR CASE", "RISK"]
    },
    {
      agent: "FACT CHECKER",
      text: `Fact score ${decision.facts}. Unsupported statements are excluded from the decision package.`,
      evidence: decision.sourceTags
    },
    {
      agent: "FINAL JUDGE",
      text: `${decision.verdict}: ${decision.summary}`,
      evidence: ["FINAL VERDICT"]
    },
    {
      agent: "RISK MANAGER",
      text: `Risk score ${decision.risk}. Hard limits remain active and cannot be overridden by the council.`,
      evidence: ["RISK VETO", "GOVERNANCE"]
    }
  ];

  state.conversations = [...lines, ...state.conversations].slice(0, 100);
}

function runResearchCycle() {
  if (state.halted) {
    showToast("Research cycle blocked while emergency halt is active.");
    return;
  }

  state.cycle += 1;
  simulatePortfolioMovement();

  const decision = {
    ...candidateLibrary[Math.floor(Math.random() * candidateLibrary.length)],
    id: Date.now(),
    timestamp: new Date().toISOString(),
    mode: state.mode
  };

  state.latestDecision = decision;
  state.decisions.unshift(decision);
  state.decisions = state.decisions.slice(0, 50);

  generateConversation(decision);

  addActivity(
    `Council reviewed ${decision.symbol}: Bull ${decision.bull}, Bear ${decision.bear}, Facts ${decision.facts}, Verdict ${decision.verdict}.`
  );

  const autoBuyVerdicts = ["BUY", "SMALL TEST POSITION", "STRONG BUY"];
  if (
    state.mode === "autopilot" &&
    autoBuyVerdicts.includes(decision.verdict) &&
    decision.allocationPct > 0
  ) {
    createHolding(decision);
    addActivity(`${decision.department}: autopilot executed the approved paper decision.`);
  }

  renderAll();
  saveState();
  showToast(`Research cycle complete: ${decision.symbol} → ${decision.verdict}`);
}

function approvePendingDecision() {
  if (!state.pendingDecision) {
    showToast("No simulated order is waiting for approval.");
    return;
  }

  createHolding(state.pendingDecision);
  state.pendingDecision = null;
  document.getElementById("approve-button").disabled = true;
  document.getElementById("reject-button").disabled = true;
  showToast("Paper trade approved.");
}

function rejectPendingDecision() {
  if (!state.pendingDecision) {
    showToast("No simulated order is waiting for approval.");
    return;
  }

  addActivity(`${state.pendingDecision.department}: user rejected the proposed ${state.pendingDecision.symbol} paper trade.`);
  state.pendingDecision = null;
  document.getElementById("approve-button").disabled = true;
  document.getElementById("reject-button").disabled = true;
  saveState();
  showToast("Paper trade rejected.");
}

function makeAgentMessage(message) {
  const colour = agentColours[message.agent] || "#79ceff";
  const evidence = (message.evidence || []).map((item) => {
    const upper = String(item).toUpperCase();
    let className = "";
    if (upper.includes("VERIFIED") || upper.includes("PRIMARY")) {
      className = "evidence-verified";
    } else if (upper.includes("STALE") || upper.includes("ASSUMPTION")) {
      className = "evidence-stale";
    } else if (upper.includes("UNVERIFIED") || upper.includes("RISK")) {
      className = "evidence-unverified";
    }

    return `<span class="evidence-chip ${className}">${escapeHtml(item)}</span>`;
  }).join("");

  return `
    <article class="agent-message" style="--agent-colour:${colour}">
      <div class="agent-message-header">
        <strong>${escapeHtml(message.agent)}</strong>
        <time>${nowTime()}</time>
      </div>
      <p>${escapeHtml(message.text)}</p>
      <div class="evidence-row">${evidence}</div>
    </article>
  `;
}

function runCouncilMeeting(openModal = true) {
  if (state.halted) {
    showToast("Council meeting blocked while emergency halt is active.");
    return;
  }

  state.meetingSeconds = MEETING_INTERVAL_SECONDS;
  const transcript = meetingScript.map((message) => makeAgentMessage(message)).join("");
  document.getElementById("meeting-transcript").innerHTML = transcript;

  state.conversations = [...meetingScript, ...state.conversations].slice(0, 100);
  addActivity("Thirty-minute council meeting completed and stored in Agent Conversations.");

  if (openModal) {
    document.getElementById("modal-backdrop").classList.add("visible");
  }

  renderConversationPage();
  saveState();
}

function toggleHalt() {
  state.halted = !state.halted;
  document.body.classList.toggle("halted", state.halted);

  const haltButton = document.getElementById("halt-button");
  haltButton.textContent = state.halted ? "Reset Halt" : "Emergency Halt";

  const systemState = document.getElementById("system-state");
  const strong = systemState.querySelector("strong");
  const small = systemState.querySelector("small");

  strong.textContent = state.halted ? "SYSTEM RISK HALT" : "PAPER SYSTEM ONLINE";
  small.textContent = state.halted
    ? "All research and simulated execution blocked"
    : "No broker or real-money access";

  addActivity(state.halted ? "Emergency risk halt activated." : "Emergency risk halt reset.");
  renderLatestDecision();
  showToast(state.halted ? "Emergency halt active." : "System returned to paper mode.");
}

function renderDepartmentPage(key) {
  const info = departmentInfo[key];
  const departmentAgents = [
    ["Deep Pattern Analyst", "Methodical history and inconsistency analysis", "READY"],
    ["Divergent Explorer", "Second-order effects and unusual connections", "READY"],
    ["Conservative Realist", "Entry quality, downside and opportunity cost", "READY"],
    ["Practical Strategist", "Converts research into executable decisions", "WAITING"],
    ["Bull Analyst", "Builds the strongest positive case", "WAITING"],
    ["Bear Analyst", "Attacks every assumption and catalyst", "WAITING"],
    ["Fact Checker", "Verifies dates, claims and source quality", "ACTIVE"],
    ["Final Judge", "Issues the evidence-weighted verdict", "WAITING"],
    ["Risk Manager", "Hard-coded final veto authority", "ACTIVE"]
  ];

  document.getElementById(`page-${key}`).innerHTML = `
    <div class="module-layout">
      <article class="module-card">
        <p class="micro">${pageMeta[key][0]}</p>
        <h3>${escapeHtml(info.title)}</h3>
        <p class="module-description">${escapeHtml(info.description)}</p>

        <div class="module-stat-grid">
          ${info.metrics.map(([label, value]) => `
            <div class="module-stat">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>

        <table class="data-table">
          <thead>
            <tr>${info.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${info.rows.map((row) => `
              <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>

        <div class="section-header">
          <div>
            <p class="micro">DEPARTMENT RULES</p>
            <h3>Strategy Controls</h3>
          </div>
        </div>

        <div class="control-grid">
          ${info.rules.map(([label, status]) => `
            <div class="control-card">
              <label>${escapeHtml(label)}<strong>${escapeHtml(status)}</strong></label>
            </div>
          `).join("")}
        </div>
      </article>

      <aside class="module-card">
        <p class="micro">INDEPENDENT TEAM</p>
        <h3>Agent Roster</h3>
        <p class="module-description">
          Initial reports remain independent before rebuttal and verification.
        </p>
        <div class="agent-roster">
          ${departmentAgents.map(([name, role, status]) => `
            <div class="agent-row">
              <div>
                <span class="agent-name">${escapeHtml(name)}</span>
                <span class="agent-role">${escapeHtml(role)}</span>
              </div>
              <span class="agent-status">${escapeHtml(status)}</span>
            </div>
          `).join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderChamberPage() {
  const pipelineSteps = [
    ["Strategy discovers a candidate", "Department-specific scanner creates a shortlist."],
    ["Independent cognitive-style reports", "Pattern, divergent, conservative and practical agents work separately."],
    ["Specialist analysis", "Technical, fundamental, news, macro, fraud, liquidity and portfolio reports."],
    ["Bull and Bear rebuttal", "The strongest positive and negative cases challenge each other."],
    ["Fact Checker verification", "Unsupported claims are removed or marked uncertain."],
    ["Final Judge verdict", "Evidence, timing and uncertainty determine the recommendation."],
    ["Hard Risk Manager", "May veto the order regardless of the council verdict."],
    ["Paper execution or approval request", "No live brokerage connection exists in this build."]
  ];

  document.getElementById("page-chamber").innerHTML = `
    <div class="module-layout">
      <article class="module-card">
        <div class="panel-header">
          <div>
            <p class="micro">ACTIVE SESSION</p>
            <h3>Council Chamber</h3>
          </div>
          <button class="button button-small" id="chamber-meeting-button">Run Meeting Now</button>
        </div>
        <p class="module-description">
          Every thirty minutes, departments discuss correct decisions, mistakes,
          contradictions, source quality, concentration and improvement tasks.
        </p>
        <div class="agent-chat" id="chamber-chat">
          ${meetingScript.slice(0, 6).map((message) => makeAgentMessage(message)).join("")}
        </div>
      </article>

      <aside class="module-card">
        <p class="micro">DECISION PROTOCOL</p>
        <h3>How a Trade Reaches Verdict</h3>
        <div class="pipeline">
          ${pipelineSteps.map(([title, detail]) => `
            <div class="pipeline-step">
              <strong>${escapeHtml(title)}</strong>
              <p>${escapeHtml(detail)}</p>
            </div>
          `).join("")}
        </div>
      </aside>
    </div>
  `;

  document.getElementById("chamber-meeting-button").addEventListener("click", () => {
    runCouncilMeeting(false);
    document.getElementById("chamber-chat").innerHTML =
      meetingScript.map((message) => makeAgentMessage(message)).join("");
    showToast("Council meeting completed.");
  });
}

function renderConversationPage() {
  const messages = state.conversations.length
    ? state.conversations
    : meetingScript.slice(0, 6);

  document.getElementById("page-conversations").innerHTML = `
    <article class="module-card">
      <div class="panel-header">
        <div>
          <p class="micro">VISIBLE AGENT NETWORK</p>
          <h3>All Agent Conversations</h3>
        </div>
        <span class="status-tag status-waiting">${messages.length} MESSAGES</span>
      </div>
      <p class="module-description">
        Every important statement carries evidence labels such as VERIFIED,
        UNVERIFIED, STALE, ASSUMPTION or RISK.
      </p>
      <div class="agent-chat">
        ${messages.map((message) => makeAgentMessage(message)).join("")}
      </div>
    </article>
  `;
}

function renderResearchPage() {
  document.getElementById("page-research").innerHTML = `
    <article class="module-card">
      <div class="panel-header">
        <div>
          <p class="micro">TASK MANAGEMENT</p>
          <h3>Research Queue</h3>
        </div>
        <span class="status-tag status-waiting">${researchTasks.length} TASKS</span>
      </div>
      <div class="research-grid">
        ${researchTasks.map(([priority, department, task, status]) => `
          <div class="research-card">
            <span class="card-label">${escapeHtml(priority)} // ${escapeHtml(department)}</span>
            <h4 class="card-title">${escapeHtml(task)}</h4>
            <p class="card-copy">
              Assigned to the relevant department and evidence-verification team.
            </p>
            <div class="card-meta">
              <span>${escapeHtml(status)}</span>
              <span>PAPER SYSTEM</span>
            </div>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderTimelinePage() {
  const decisions = state.decisions.length
    ? state.decisions
    : candidateLibrary.slice(0, 4).map((decision, index) => ({
        ...decision,
        timestamp: new Date(Date.now() - index * 900000).toISOString()
      }));

  document.getElementById("page-timeline").innerHTML = `
    <article class="module-card">
      <p class="micro">DECISION MEMORY</p>
      <h3>Decision Timeline</h3>
      <p class="module-description">
        Every proposal, rejection, approval and reasoning package is retained for review.
      </p>
      <div class="timeline">
        ${decisions.map((decision) => `
          <div class="timeline-item">
            <time>${new Date(decision.timestamp).toLocaleString("en-AU")}</time>
            <h4>${escapeHtml(decision.department)} → ${escapeHtml(decision.symbol)} // ${escapeHtml(decision.verdict)}</h4>
            <p>${escapeHtml(decision.summary)}</p>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderHoldingsPage() {
  const cards = state.holdings.length
    ? state.holdings.map((holding) => `
        <div class="holding-card">
          <span class="card-label">${escapeHtml(holding.portfolio)}</span>
          <h4 class="card-title">${escapeHtml(holding.symbol)}</h4>
          <p class="portfolio-value">${money(holding.value)}</p>
          <p class="${holding.pnlPct >= 0 ? "positive-copy" : ""}">
            ${money(holding.value - holding.cost)} (${pct(holding.pnlPct)})
          </p>
          <p class="card-copy">${escapeHtml(holding.thesis)}</p>
          <div class="card-meta">
            <span>OPENED ${new Date(holding.openedAt).toLocaleDateString("en-AU")}</span>
            <span>PAPER</span>
          </div>
        </div>
      `).join("")
    : `
      <div class="holding-card">
        <span class="card-label">NO POSITIONS</span>
        <h4 class="card-title">Paper portfolio is currently in cash</h4>
        <p class="card-copy">Approve a simulated trade or enable Autopilot mode to create demo holdings.</p>
      </div>
    `;

  document.getElementById("page-holdings").innerHTML = `
    <article class="module-card">
      <p class="micro">PAPER PORTFOLIO</p>
      <h3>Current Holdings</h3>
      <div class="holding-grid">${cards}</div>
    </article>
  `;
}

function renderPerformancePage() {
  const ranked = [...state.portfolios]
    .sort((a, b) => b.returnPct - a.returnPct);

  document.getElementById("page-performance").innerHTML = `
    <div class="module-layout">
      <article class="module-card">
        <p class="micro">RISK-ADJUSTED EVALUATION</p>
        <h3>Strategy Scorecard</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Strategy</th>
              <th>Return</th>
              <th>Drawdown</th>
              <th>Consistency</th>
              <th>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            ${ranked.map((portfolio, index) => `
              <tr>
                <td>#${index + 1}</td>
                <td>${escapeHtml(portfolio.name)}</td>
                <td>${pct(portfolio.returnPct)}</td>
                <td>${(Math.abs(portfolio.returnPct) * 0.42 + index * 0.2).toFixed(2)}%</td>
                <td>${Math.max(55, 92 - index * 7)}</td>
                <td>${Math.max(58, 91 - index * 6)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </article>

      <aside class="module-card">
        <p class="micro">LOCKED PRIORITIES</p>
        <h3>How “Best” Is Defined</h3>
        <div class="pipeline">
          ${[
            "Risk-adjusted return",
            "Maximum drawdown",
            "Performance against benchmark",
            "Consistency",
            "Average gain versus average loss",
            "Total return",
            "Win rate",
            "Number of trades"
          ].map((item, index) => `
            <div class="pipeline-step">
              <strong>${String(index + 1).padStart(2, "0")} // ${escapeHtml(item)}</strong>
            </div>
          `).join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderLossPage() {
  const reviews = state.lossReviews.length
    ? state.lossReviews
    : [
        {
          symbol: "DEMO",
          portfolio: "No closed loss yet",
          lossPct: 0,
          classification: "WAITING FOR DATA",
          questions: [
            "What did we predict?",
            "What actually happened?",
            "Which assumption failed?",
            "Was the reasoning good even if the result was bad?"
          ]
        }
      ];

  document.getElementById("page-loss").innerHTML = `
    <article class="module-card">
      <p class="micro">IMMEDIATE FAILURE MEETINGS</p>
      <h3>Loss Review Room</h3>
      <p class="module-description">
        Every meaningful loss opens a separate department meeting and classifies
        the outcome as reasoning quality, timing, data, sizing or unpredictable event.
      </p>
      <div class="loss-grid">
        ${reviews.map((review) => `
          <div class="loss-card">
            <span class="card-label">${escapeHtml(review.portfolio)}</span>
            <h4 class="card-title">${escapeHtml(review.symbol)} // ${escapeHtml(review.classification)}</h4>
            <p class="card-copy">Current paper outcome: ${pct(review.lossPct)}</p>
            <div class="pipeline">
              ${review.questions.map((question) => `
                <div class="pipeline-step">
                  <strong>${escapeHtml(question)}</strong>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderLearningPage() {
  document.getElementById("page-learning").innerHTML = `
    <div class="module-layout">
      <article class="module-card">
        <p class="micro">META-LEARNING DEPARTMENT</p>
        <h3>Improvement Council</h3>
        <p class="module-description">
          This team can propose changes, but cannot silently rewrite production
          reasoning or weaken hard risk limits.
        </p>
        <div class="proposal-grid">
          ${state.improvementProposals.map((proposal) => `
            <div class="proposal-card">
              <span class="card-label">${escapeHtml(proposal.owner)}</span>
              <h4 class="card-title">${escapeHtml(proposal.title)}</h4>
              <p class="card-copy">${escapeHtml(proposal.detail)}</p>
              <div class="card-meta">
                <span>${escapeHtml(proposal.status)}</span>
                <span>USER APPROVAL REQUIRED</span>
              </div>
            </div>
          `).join("")}
        </div>
      </article>

      <aside class="module-card">
        <p class="micro">SAFE CHANGE PIPELINE</p>
        <h3>Versioned Improvement</h3>
        <div class="pipeline">
          ${[
            ["Failure detected", "Outcome and reasoning are separated."],
            ["Improvement proposed", "A specific, measurable rule change is written."],
            ["Historical backtest", "The idea is tested against prior data."],
            ["Shadow simulation", "The change runs without affecting decisions."],
            ["Improvement council", "Bias, risk and governance teams review it."],
            ["User approval", "No production change occurs without approval."],
            ["Versioned update", "The accepted change is recorded and reversible."]
          ].map(([title, detail]) => `
            <div class="pipeline-step">
              <strong>${escapeHtml(title)}</strong>
              <p>${escapeHtml(detail)}</p>
            </div>
          `).join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderSourcesPage() {
  document.getElementById("page-sources").innerHTML = `
    <article class="module-card">
      <p class="micro">SOURCE TRUST HIERARCHY</p>
      <h3>Evidence Control</h3>
      <p class="module-description">
        Lower-ranked sources can create research leads, but cannot independently
        verify a simulated trade.
      </p>
      <div class="source-grid">
        ${sourceHierarchy.map(([tier, source, trust, rule]) => `
          <div class="source-card">
            <span class="card-label">${escapeHtml(tier)} // ${escapeHtml(trust)}</span>
            <h4 class="card-title">${escapeHtml(source)}</h4>
            <p class="card-copy">${escapeHtml(rule)}</p>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderRiskPage() {
  document.getElementById("page-risk").innerHTML = `
    <div class="module-layout">
      <article class="module-card">
        <p class="micro">HARD LIMITS</p>
        <h3>Risk Controls</h3>
        <div class="control-grid">
          ${riskControls.map(([label, value]) => `
            <div class="control-card">
              <label>${escapeHtml(label)}<strong>${escapeHtml(value)}</strong></label>
            </div>
          `).join("")}
        </div>
      </article>

      <aside class="module-card">
        <p class="micro">HUMAN CONTROL</p>
        <h3>Execution Modes</h3>
        <div class="pipeline">
          <div class="pipeline-step">
            <strong>Approval Mode</strong>
            <p>Every simulated order waits for your approve or reject decision.</p>
          </div>
          <div class="pipeline-step">
            <strong>Autopilot Mode</strong>
            <p>Small paper orders can execute after every council and risk stage passes.</p>
          </div>
          <div class="pipeline-step">
            <strong>Emergency Halt</strong>
            <p>Immediately blocks research cycles, meetings and simulated execution.</p>
          </div>
          <div class="pipeline-step">
            <strong>Live Trading</strong>
            <p>Not implemented and explicitly blocked in this website build.</p>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderStaticPages() {
  ["congress", "news", "whales", "quant", "consensus"].forEach(renderDepartmentPage);
  renderChamberPage();
  renderConversationPage();
  renderResearchPage();
  renderTimelinePage();
  renderHoldingsPage();
  renderPerformancePage();
  renderLossPage();
  renderLearningPage();
  renderSourcesPage();
  renderRiskPage();
}

function switchPage(page) {
  document.querySelectorAll(".page").forEach((section) => {
    section.classList.toggle("active", section.id === `page-${page}`);
  });

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const [kicker, title] = pageMeta[page];
  document.getElementById("page-kicker").textContent = kicker;
  document.getElementById("page-title").textContent = title;

  if (page === "conversations") renderConversationPage();
  if (page === "timeline") renderTimelinePage();
  if (page === "holdings") renderHoldingsPage();
  if (page === "performance") renderPerformancePage();
  if (page === "loss") renderLossPage();
  if (page === "learning") renderLearningPage();
}

function updateMeetingCountdown() {
  if (!state.halted) {
    state.meetingSeconds -= 1;
  }

  if (state.meetingSeconds <= 0) {
    runCouncilMeeting(false);
    state.meetingSeconds = MEETING_INTERVAL_SECONDS;
  }

  const minutes = Math.floor(state.meetingSeconds / 60);
  const seconds = state.meetingSeconds % 60;
  document.getElementById("meeting-countdown").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderMode() {
  const toggle = document.getElementById("mode-toggle");
  toggle.checked = state.mode === "autopilot";
  renderLatestDecision();
}

function renderAll() {
  renderPortfolios();
  renderActivity();
  renderLatestDecision();
  renderStaticPages();
  renderMode();
}

function initialiseEvents() {
  document.getElementById("main-nav").addEventListener("click", (event) => {
    const button = event.target.closest(".nav-button");
    if (button) switchPage(button.dataset.page);
  });

  document.getElementById("run-cycle-button").addEventListener("click", runResearchCycle);
  document.getElementById("quick-simulate-button").addEventListener("click", runResearchCycle);
  document.getElementById("meeting-button").addEventListener("click", () => runCouncilMeeting(true));
  document.getElementById("halt-button").addEventListener("click", toggleHalt);
  document.getElementById("approve-button").addEventListener("click", approvePendingDecision);
  document.getElementById("reject-button").addEventListener("click", rejectPendingDecision);

  document.getElementById("mode-toggle").addEventListener("change", (event) => {
    state.mode = event.target.checked ? "autopilot" : "approval";
    addActivity(`Execution mode changed to ${state.mode.toUpperCase()}.`);
    renderLatestDecision();
    saveState();
    showToast(`${state.mode === "autopilot" ? "Autopilot" : "Approval"} mode enabled.`);
  });

  document.getElementById("close-modal-button").addEventListener("click", () => {
    document.getElementById("modal-backdrop").classList.remove("visible");
  });

  document.getElementById("modal-backdrop").addEventListener("click", (event) => {
    if (event.target.id === "modal-backdrop") {
      event.currentTarget.classList.remove("visible");
    }
  });
}

loadState();
renderAll();
initialiseEvents();
updateMeetingCountdown();
window.setInterval(updateMeetingCountdown, 1000);

window.addEventListener("beforeunload", saveState);
console.info(`Autopilot Council V${APP_VERSION} loaded in paper-only demo mode.`);
