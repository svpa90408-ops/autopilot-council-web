# 1 — Create the free Cloudflare account

Cloudflare is used because the project needs a browser-accessible backend, a database and a scheduled job while avoiding Azure payment setup.

1. Open `dash.cloudflare.com` in Chrome.
2. Create an account with an email you control long-term.
3. Verify the email.
4. Do not add a payment method for this first release.
5. In the dashboard, open **Workers & Pages** once so the Workers subdomain can be created.

The project uses:

- Workers for the API
- D1 for the database
- Cron Triggers for the 30-minute schedule
- Workers AI when available

No API keys should ever be placed in GitHub files or the browser frontend.
