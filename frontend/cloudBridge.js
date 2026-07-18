(() => {
  "use strict";

  const apiBase = String(window.AUTOPILOT_CONFIG?.API_BASE_URL ?? "").replace(/\/$/, "");
  if (!apiBase || !window.AutopilotDemo) return;

  const app = window.AutopilotDemo;
  let connected = false;
  let syncing = false;

  function adminToken() {
    let token = sessionStorage.getItem("autopilotAdminToken") ?? "";
    if (!token) {
      token = window.prompt(
        "Enter the Cloudflare Worker ADMIN_TOKEN. It stays in this browser tab and is not saved to GitHub."
      ) ?? "";
      if (token) sessionStorage.setItem("autopilotAdminToken", token);
    }
    return token;
  }

  async function api(path, options = {}, admin = false) {
    const headers = new Headers(options.headers ?? {});
    headers.set("content-type", "application/json");
    if (admin) {
      const token = adminToken();
      if (!token) throw new Error("Admin token is required.");
      headers.set("authorization", `Bearer ${token}`);
    }
    const response = await fetch(`${apiBase}${path}`, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error ?? `API request failed (${response.status}).`);
    return payload;
  }

  function mapDecision(decision) {
    if (!decision) return null;
    return {
      ...decision,
      department: decision.candidate?.strategy ?? "Council",
      portfolioId: decision.candidate?.strategy,
      symbol: decision.candidate?.symbol ?? "NONE",
      headline: decision.candidate?.headline ?? "",
      bull: Number(decision.bullScore ?? 0),
      bear: Number(decision.bearScore ?? 0),
      facts: Number(decision.factScore ?? 0),
      risk: Number(decision.riskScore ?? 0),
      confidence: Number(decision.confidence ?? 0),
      allocationPct: Number(decision.allocationPct ?? 0),
      summary: decision.summary ?? "",
      sourceTags: (decision.candidate?.evidence ?? []).map((item) => item.status),
      verdict: decision.verdict ?? "WAIT"
    };
  }

  function applyDashboard(payload) {
    for (const remote of payload.portfolios ?? []) {
      const local = app.state.portfolios.find((item) => item.id === remote.strategy);
      if (!local) continue;
      local.value = Number(remote.value ?? local.value);
      local.cash = Number(remote.cash ?? local.cash);
      local.returnPct = Number(remote.returnPct ?? 0);
      local.positions = Number(remote.positions ?? 0);
    }

    app.state.holdings = (payload.holdings ?? []).map((holding) => ({
      id: holding.id,
      portfolioId: holding.strategy,
      portfolio: app.state.portfolios.find((item) => item.id === holding.strategy)?.name ?? holding.strategy,
      symbol: holding.symbol,
      value: Number(holding.quantity) * Number(holding.currentPrice),
      cost: Number(holding.quantity) * Number(holding.averagePrice),
      pnlPct: Number(holding.averagePrice)
        ? ((Number(holding.currentPrice) / Number(holding.averagePrice)) - 1) * 100
        : 0,
      thesis: holding.thesis,
      openedAt: holding.openedAt
    }));

    app.state.latestDecision = mapDecision(payload.latestDecision);
    app.state.pendingDecision = app.state.latestDecision;
    app.state.conversations = (payload.recentMessages ?? []).map((message) => ({
      agent: message.agent,
      text: message.text,
      evidence: message.evidenceStatuses ?? []
    }));
    app.state.lossReviews = payload.recentLossReviews ?? [];
    app.state.halted = Boolean(payload.status?.halted);
    document.body.classList.toggle("halted", app.state.halted);
    app.renderAll();
  }

  async function sync(showMessage = false) {
    if (syncing) return;
    syncing = true;
    try {
      const dashboard = await api("/api/dashboard");
      applyDashboard(dashboard);
      connected = true;
      if (showMessage) app.showToast("Connected to the cloud backend.");
    } catch (error) {
      connected = false;
      console.error(error);
      if (showMessage) app.showToast(error.message);
    } finally {
      syncing = false;
      updateConnectButton();
    }
  }

  function capture(id, handler) {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      try { await handler(); } catch (error) { app.showToast(error.message); }
    }, true);
  }

  function updateConnectButton() {
    const button = document.getElementById("cloud-connect-button");
    if (!button) return;
    button.textContent = connected ? "Cloud Connected" : "Connect Cloud";
  }

  const controls = document.querySelector(".topbar-controls");
  if (controls) {
    const button = document.createElement("button");
    button.id = "cloud-connect-button";
    button.className = "button button-secondary";
    button.textContent = "Connect Cloud";
    button.addEventListener("click", () => sync(true));
    controls.prepend(button);
  }

  capture("run-cycle-button", async () => {
    await api("/api/admin/cycle", {
      method: "POST",
      body: JSON.stringify({ autoExecute: app.state.mode === "autopilot" })
    }, true);
    await sync();
    app.showToast("Cloud research cycle completed.");
  });

  capture("quick-simulate-button", async () => {
    await api("/api/admin/cycle", {
      method: "POST",
      body: JSON.stringify({ autoExecute: app.state.mode === "autopilot" })
    }, true);
    await sync();
  });

  capture("meeting-button", async () => {
    await api("/api/admin/meeting", { method: "POST", body: "{}" }, true);
    await sync();
    app.switchPage("conversations");
  });

  capture("halt-button", async () => {
    await api("/api/admin/halt", {
      method: "POST",
      body: JSON.stringify({ halted: !app.state.halted })
    }, true);
    await sync();
  });

  capture("approve-button", async () => {
    const decisionId = app.state.latestDecision?.id;
    if (!decisionId) throw new Error("No cloud decision is awaiting approval.");
    await api("/api/admin/approve", {
      method: "POST",
      body: JSON.stringify({ decisionId })
    }, true);
    await sync();
  });

  capture("reject-button", async () => {
    const decisionId = app.state.latestDecision?.id;
    if (!decisionId) throw new Error("No cloud decision is awaiting rejection.");
    await api("/api/admin/reject", {
      method: "POST",
      body: JSON.stringify({ decisionId, reason: "Rejected from browser dashboard." })
    }, true);
    await sync();
  });

  const modeToggle = document.getElementById("mode-toggle");
  if (modeToggle) {
    modeToggle.addEventListener("change", async (event) => {
      event.stopImmediatePropagation();
      const mode = event.target.checked ? "autopilot" : "approval";
      try {
        await api("/api/admin/mode", {
          method: "POST",
          body: JSON.stringify({ mode })
        }, true);
        app.state.mode = mode;
        await sync();
      } catch (error) {
        event.target.checked = !event.target.checked;
        app.showToast(error.message);
      }
    }, true);
  }

  sync(false);
  window.setInterval(() => sync(false), 15000);
})();
