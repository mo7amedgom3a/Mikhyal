/** Shared tutor contract + deterministic fallback used when no LLM is configured. */
import type { Diagnosis, Mission, StepId } from "./types";
import { nextHint } from "./pedagogy";

export interface TutorRequest {
  missionId: string;
  step: StepId | "exam";
  message?: string;
  hintLevel: number;
  diagnosis?: Diagnosis;
  /** Compact description of the current sim/workspace state. */
  context?: string;
  history?: { role: "student" | "tutor"; text: string }[];
}

export interface TutorResponse {
  reply: string;
  hintLevel: number;
  source: "rules" | "llm";
}

export function rulesReply(mission: Mission, req: TutorRequest): TutorResponse {
  const hints = req.step === "exam" ? [] : mission.hints[req.step] ?? [];
  if (req.diagnosis && !req.message) {
    return { reply: req.diagnosis.prompt, hintLevel: req.hintLevel, source: "rules" };
  }
  const h = nextHint(hints, req.hintLevel);
  const lead = req.message ? "سؤال حلو. خليني أوجّهك من غير ما أحرق الإجابة: " : "";
  return { reply: lead + h.message, hintLevel: h.hintLevel, source: "rules" };
}

export function systemPrompt(mission: Mission): string {
  return [
    "You are «مِخيال», a Socratic physics and math tutor for Egyptian secondary-school students (age 15–18).",
    "Reply in friendly Egyptian Arabic (عامية مصرية), with standard scientific terms and symbols.",
    "Write every equation, symbol or quantity with units as LaTeX between single dollar signs, e.g. $v^2 = u^2 - 2as$, $\\frac{F}{m}$, $\\gamma$, $9.8\\,\\mathrm{m/s^2}$. Never use $$ display math.",
    "Rules:",
    "- NEVER give the final numeric answer or the full target equation. Guide with one focused question or a small next step.",
    "- Keep replies short: 1–3 sentences, max ~60 words.",
    "- If a diagnosed error is provided, address that specific reasoning error.",
    "- Suggest an experiment in the simulation when a misconception is conceptual.",
    "- Only rely on the verified physics below; if unsure, ask the student to test it in the simulation.",
    "- Stay on the lesson topic; politely redirect unrelated questions.",
    "",
    `Mission: ${mission.title}`,
    `Verified ground truth: ${mission.groundTruth}`,
    `Challenge: ${mission.challenge.story} ${mission.challenge.goal}`,
  ].join("\n");
}

export function userTurn(req: TutorRequest): string {
  const parts = [`Current step: ${req.step}`, `Hint level so far: ${req.hintLevel}`];
  if (req.context) parts.push(`Workspace state: ${req.context}`);
  if (req.diagnosis) parts.push(`Diagnosed error (${req.diagnosis.errorType}): ${req.diagnosis.prompt}`);
  parts.push(
    req.message
      ? `Student says: «${req.message.slice(0, 600)}»`
      : "The student pressed the hint button. Give the next Socratic hint, a bit more specific than before.",
  );
  return parts.join("\n");
}
