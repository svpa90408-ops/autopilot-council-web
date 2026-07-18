# 2 — Deploy the Cloudflare backend

## Prerequisites

Install Node.js 22 or later. In PowerShell, verify:

```powershell
node --version
npm --version
```

## A. Open the project

Extract the ZIP, open the `worker` folder in VS Code and open its terminal.

```powershell
cd path\to\autopilot-council-v4\worker
npm install
npm run typecheck
npm test
```

## B. Sign into Cloudflare

```powershell
npx wrangler login
```

A browser window opens. Approve the connection.

## C. Create the database

```powershell
npx wrangler d1 create autopilot-council-db
```

Wrangler prints a `database_id`. Open `wrangler.jsonc` and replace:

```text
REPLACE_WITH_D1_DATABASE_ID
```

with that ID.

## D. Update safe public variables

In `wrangler.jsonc`:

- Replace `YOUR-GITHUB-USERNAME` in `ALLOWED_ORIGIN`.
- Replace the example email in `SEC_USER_AGENT` with an email you control.
- Keep `APP_MODE` as `paper`.
- Keep `LIVE_TRADING_ENABLED` as `false`.

For your current GitHub Pages project, the allowed origin should resemble:

```text
https://svpa90408-ops.github.io
```

Do not include the repository path in the origin.

## E. Apply the D1 schema

```powershell
npm run db:remote
```

## F. Create the admin secret

Generate a long random value. Do not paste it into chat or GitHub.

```powershell
npx wrangler secret put ADMIN_TOKEN
```

Paste the value when prompted.

## G. Add one free market-data key

Use either Twelve Data or Alpha Vantage. Only one is required.

```powershell
npx wrangler secret put TWELVE_DATA_API_KEY
```

or:

```powershell
npx wrangler secret put ALPHA_VANTAGE_API_KEY
```

## H. Deploy

```powershell
npm run deploy
```

Wrangler prints a URL such as:

```text
https://autopilot-council-api.<your-subdomain>.workers.dev
```

Open:

```text
https://...workers.dev/api/health
```

You should see JSON with `ok: true`, `mode: paper`, and `liveTradingEnabled: false`.
