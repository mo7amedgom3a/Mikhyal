import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getMission } from "@/lib/missions";
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
import { getWorkbenchProblem } from "@/lib/workbench/problems";

const MODEL = process.env.MIKHYAL_TUTOR_MODEL || "claude-opus-5-5";

export async function POST(request: Request) {
  let body: TutorRequest;
  try {
    body = (await request.json()) as TutorRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  let system: string;
  let fallback: TutorResponse;
  if (body.workbenchId) {
    const problem = getWorkbenchProblem(body.workbenchId);
    if (!problem) return NextResponse.json({ error: "unknown workbench problem" }, { status: 404 });
    system = workbenchSystemPrompt(problem);
    fallback = workbenchRulesReply(problem, body);
  } else if (body.sandboxId) {
    const sandbox = getSandbox(body.sandboxId);
    const level = sandbox?.levels.find((l) => l.id === body.levelId);
    if (!sandbox || !level) return NextResponse.json({ error: "unknown sandbox level" }, { status: 404 });
    system = sandboxSystemPrompt(sandbox, level);
    fallback = sandboxRulesReply(level, body);
  } else {
    const mission = getMission(body.missionId ?? "");
    if (!mission) return NextResponse.json({ error: "unknown mission" }, { status: 404 });
    system = systemPrompt(mission);
    fallback = rulesReply(mission, body);
  }
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json(fallback);

  try {
    const client = new Anthropic();
    const history: Anthropic.Beta.BetaMessageParam[] = (body.history ?? []).slice(-6).map((h) => ({
      role: h.role === "student" ? "user" : "assistant",
      content: h.text,
    }));
    // Conversation must start with a user turn.
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
    if (response.stop_reason === "refusal") return NextResponse.json(fallback);
    const text = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    if (!text) return NextResponse.json(fallback);
    const result: TutorResponse = { reply: text, hintLevel: fallback.hintLevel, source: "llm" };
    return NextResponse.json(result);
  } catch (err) {
    console.error("tutor LLM call failed, using rules engine", err instanceof Error ? err.message : err);
    return NextResponse.json(fallback);
  }
}
