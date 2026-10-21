/** Socratic tutor: rules engine by default, Claude when ANTHROPIC_API_KEY is set. */
import Anthropic from "@anthropic-ai/sdk";
import { hydrateMission } from "@/lib/engines/missions";
import {
  rulesReply,
  sandboxRulesReply,
  sandboxSystemPrompt,
  systemPrompt,
  userTurn,
  workbenchRulesReply,
  workbenchSystemPrompt,
  type TutorRequest,
  type TutorResponse,
} from "@/lib/engine/tutor";
import { getSandbox } from "@/lib/sandbox";
import { notFound } from "../http";
import { findContent, missionDetail } from "./content";
import { workbenchSpec } from "./grading";

const MODEL = process.env.MIKHYAL_TUTOR_MODEL || "claude-opus-5-5";

export async function tutorReply(body: TutorRequest): Promise<TutorResponse> {
  let system: string;
  let fallback: TutorResponse;
  if (body.workbenchId) {
    const problem = workbenchSpec(body.workbenchId);
    system = workbenchSystemPrompt(problem);
    fallback = workbenchRulesReply(problem, body);
  } else if (body.sandboxId) {
    const sandbox = getSandbox(body.sandboxId.replace(/^lab_/, ""));
    const level = sandbox?.levels.find((l) => l.id === body.levelId);
    if (!sandbox || !level) throw notFound("sandbox level");
    system = sandboxSystemPrompt(sandbox, level);
    fallback = sandboxRulesReply(level, body);
  } else {
    findContent("missions", body.missionId ?? "");
    const { mission, exam } = missionDetail(body.missionId ?? "");
    const runtime = hydrateMission(mission, exam ?? undefined);
    system = systemPrompt(runtime);
    fallback = rulesReply(runtime, body);
  }
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const client = new Anthropic();
    const history: Anthropic.Beta.BetaMessageParam[] = (body.history ?? []).slice(-6).map((h) => ({ role: h.role === "student" ? "user" : "assistant", content: h.text }));
    while (history.length && history[0].role !== "user") history.shift();
    const response = await client.beta.messages.create(
      {
        model: MODEL,
        max_tokens: 2048,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        messages: [...history, { role: "user", content: userTurn(body) }],
      },
      { timeout: 20_000 },
    );
    if (response.stop_reason === "refusal") return fallback;
    const text = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    return text ? { reply: text, hintLevel: fallback.hintLevel, source: "llm" } : fallback;
  } catch (err) {
    console.error("tutor LLM call failed, using rules engine", err instanceof Error ? err.message : err);
    return fallback;
  }
}
