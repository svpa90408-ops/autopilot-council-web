import type { Env } from "./types";
import { applyCors, assertPaperOnly, corsHeaders, requireAdmin } from "./security";
import { json } from "./utils";
import { ensureSeedData, getSetting } from "./db";
import { handleAdminRequest, handlePublicRequest } from "./routes";
import { runResearchCycle, refreshMarks } from "./services/cycle";
import { runCouncilMeeting } from "./services/meeting";
import { detectLossReviews } from "./services/learning";

async function handleFetch(request: Request, env: Env): Promise<Response> {
  assertPaperOnly(env);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  const url = new URL(request.url);
  try {
    await ensureSeedData(env);
    const publicResponse = await handlePublicRequest(request, env, url);
    if (publicResponse) return applyCors(publicResponse, request, env);

    if (url.pathname.startsWith("/api/admin/")) {
      const denied = requireAdmin(request, env);
      if (denied) return applyCors(denied, request, env);
      const adminResponse = await handleAdminRequest(request, env, url);
      if (adminResponse) return applyCors(adminResponse, request, env);
    }

    return applyCors(json({ error: "Not found." }, { status: 404 }), request, env);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return applyCors(json({ error: message }, { status: 500 }), request, env);
  }
}

async function handleScheduled(env: Env): Promise<void> {
  assertPaperOnly(env);
  await ensureSeedData(env);
  const halted = await getSetting(env, "system_halted", "false");
  if (halted === "true") {
    console.log("Scheduled cycle skipped because system_halted=true.");
    return;
  }

  const mode = await getSetting(env, "execution_mode", "approval");
  await runResearchCycle(env, undefined, mode === "autopilot");
  await refreshMarks(env);
  await detectLossReviews(env);
  await runCouncilMeeting(env, "scheduled");
}

export default {
  fetch: handleFetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  }
};
