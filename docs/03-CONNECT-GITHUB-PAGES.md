# 3 — Connect the existing GitHub Pages website

Your existing repository can remain the website host.

## A. Update the frontend files

Upload these files from the `frontend` folder to the root of `autopilot-council-web`:

- `index.html`
- `styles.css`
- `app.js`
- `cloudBridge.js`
- `config.js`

Replace the older versions when GitHub asks.

## B. Set the Worker URL

Before uploading `config.js`, change:

```js
API_BASE_URL: ""
```

to your Worker URL:

```js
API_BASE_URL: "https://autopilot-council-api.<your-subdomain>.workers.dev"
```

Do not put the admin token or any data-provider key in this file.

## C. Wait for GitHub Pages

After committing the files, wait for the Pages deployment and press:

```text
Ctrl + Shift + R
```

on the website.

A **Connect Cloud** button appears. When you use a protected action, the website asks for the Worker `ADMIN_TOKEN`. The token is kept only in `sessionStorage` for that browser tab and is not uploaded to GitHub.
