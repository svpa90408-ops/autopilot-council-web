import type { Env } from "./types";
import { json } from "./utils";

export function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const requestOrigin = request.headers.get("origin") ?? "";
  const allowed = env.ALLOWED_ORIGIN?.trim();

  if (allowed === "*" || (allowed && requestOrigin === allowed)) {
    headers.set("access-control-allow-origin", allowed === "*" ? "*" : requestOrigin);
  }
  headers.set("vary", "origin");
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type,authorization");
  headers.set("access-control-max-age", "86400");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  headers.set("cache-control", "no-store");
  return headers;
}

export function applyCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  corsHeaders(request, env).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function requireAdmin(request: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN) {
    return json({ error: "ADMIN_TOKEN is not configured on the Worker." }, { status: 503 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!provided || provided !== env.ADMIN_TOKEN) {
    return json({ error: "Admin authorisation required." }, { status: 401 });
  }
  return null;
}

export function assertPaperOnly(env: Env): void {
  if (env.APP_MODE !== "paper" || env.LIVE_TRADING_ENABLED !== "false") {
    throw new Error("Safety lock: this build must remain paper-only with live trading disabled.");
  }
}
