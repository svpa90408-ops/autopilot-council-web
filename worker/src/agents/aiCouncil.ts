import type { Candidate, Env, Verdict } from "../types";
import { buildCouncilPrompt } from "./prompts";
import { runRuleCouncil, type RuleCouncilOutput } from "./ruleCouncil";
import { clamp, safeJsonParse } from "../utils";

interface AiPayload {
  response?: string;
  result?: { response?: string };
}

export async function runCouncil(env: Env, candidate: Candidate): Promise<RuleCouncilOutput> {
  const fallback = runRuleCouncil(candidate);
  if (env.AI_ENABLED !== "true" || !env.AI) return fallback;

  try {
    const result = await env.AI.run(env.AI_MODEL as keyof AiModels, {
      messages: [
        { role: "system", content: "Return valid JSON only. Do not invent facts or sources." },
        { role: "user", content: buildCouncilPrompt(candidate) }
      ],
      max_tokens: 1600,
      temperature: 0.15
    }) as AiPayload | string;

    const raw = typeof result === "string" ? result : result.response ?? result.result?.response ?? "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = safeJsonParse<Record<string, unknown> | null>(cleaned, null);
    if (!parsed) return fallback;

    const allowedVerdicts: Verdict[] = ["STRONG BUY", "BUY", "SMALL TEST POSITION", "WATCH", "WAIT FOR BETTER PRICE", "HOLD", "REDUCE", "SELL", "REJECT", "INSUFFICIENT EVIDENCE"];
    const verdict = allowedVerdicts.includes(parsed.suggestedVerdict as Verdict)
      ? parsed.suggestedVerdict as Verdict
      : fallback.suggestedVerdict;
    const aiMessages = Array.isArray(parsed.messages) ? parsed.messages : [];

    return {
      messages: aiMessages.length >= 4 ? aiMessages.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          agent: String(row.agent ?? "COUNCIL AGENT"),
          department: candidate.strategy,
          role: "AI council report",
          text: String(row.text ?? "No report."),
          confidence: clamp(Number(row.confidence ?? 50), 0, 100),
          evidenceStatuses: Array.isArray(row.evidenceStatuses) ? row.evidenceStatuses.map(String) : ["UNVERIFIED"],
          createdAt: new Date().toISOString()
        };
      }) : fallback.messages,
      bullScore: clamp(Number(parsed.bullScore ?? fallback.bullScore), 0, 100),
      bearScore: clamp(Number(parsed.bearScore ?? fallback.bearScore), 0, 100),
      factScore: clamp(Number(parsed.factScore ?? fallback.factScore), 0, 100),
      confidence: clamp(Number(parsed.confidence ?? fallback.confidence), 0, 100),
      summary: String(parsed.summary ?? fallback.summary),
      suggestedVerdict: verdict
    };
  } catch (error) {
    console.warn("Workers AI council failed; using deterministic fallback.", error);
    return fallback;
  }
}
