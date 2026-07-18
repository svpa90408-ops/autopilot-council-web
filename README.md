# Autopilot Council V4 — Free-First, Paid-Ready

A browser-based, paper-only investment-research system with five strategy departments, visible agent conversations, hard risk controls, a Cloudflare Worker backend, D1 database and a 30-minute scheduled council meeting.

## Safety boundary

This release cannot place real trades.

- `APP_MODE` must remain `paper`.
- `LIVE_TRADING_ENABLED` must remain `false`.
- There is no live broker adapter.
- Penny stocks, leverage, options and short selling are blocked in the risk rules.
- Fact Checker and hard Risk Manager can veto every proposal.

## Project structure

```text
autopilot-council-v4/
├── frontend/                  GitHub Pages website
│   ├── index.html
│   ├── styles.css
│   ├── app.js                Offline/demo interface
│   ├── cloudBridge.js        Connects the interface to the Worker API
│   └── config.js             Public API URL only; no secrets
├── worker/                    Cloudflare Worker backend
│   ├── src/
│   │   ├── agents/           AI and deterministic council logic
│   │   ├── data/             GDELT, SEC, market and import adapters
│   │   ├── services/         Risk, portfolio, meetings and learning
│   │   └── index.ts
│   ├── migrations/           D1 database schema
│   ├── test/                 Unit tests
│   ├── wrangler.jsonc
│   └── package.json
├── sample-data/              Normalised import examples
├── docs/                     Explicit deployment and setup guides
├── scripts/check-project.sh
└── .github/workflows/deploy-worker.yml
```

## What is real after deployment

- Cloud API and persistent D1 database
- 30-minute Cloudflare Cron Trigger
- Real GDELT global-news discovery
- Real SEC EDGAR submissions and company-facts access
- Real delayed market quotes after adding a free Twelve Data or Alpha Vantage key
- Cloudflare Workers AI council when enabled and within the account allocation
- Paper holdings, decisions, meetings, loss reviews and improvement proposals

## What still requires a legitimate provider or import

- Congressional stock trades: official portals do not provide a simple universal trade API in this project, so the system uses an admin-only normalised import endpoint.
- Top-ten traders: requires an opt-in, verified or broker-verified signal source. Random social-media claims are deliberately rejected.
- Institutional signals: import normalised data derived from official SEC filings, or extend the adapter.

## Start here

Read these in order:

1. `docs/01-CLOUDFLARE-ACCOUNT.md`
2. `docs/02-DEPLOY-BACKEND.md`
3. `docs/03-CONNECT-GITHUB-PAGES.md`
4. `docs/04-DATA-SOURCES.md`
5. `docs/05-OPERATING-THE-SYSTEM.md`

## Local verification

```bash
./scripts/check-project.sh
```

The included build was type-checked and its unit tests passed before packaging.
