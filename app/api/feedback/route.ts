import { NextResponse } from "next/server";
import { sanitizeFeedback } from "@/lib/feedback";

/**
 * Collects lesson feedback. Every entry is written to the server log as one JSON line
 * (prefix "[mikhyal-feedback]"); if FEEDBACK_WEBHOOK_URL is set it is also POSTed there
 * (e.g. a Google Apps Script that appends to a Sheet, or a Slack/Discord webhook).
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const feedback = sanitizeFeedback(raw);
  if (!feedback) return NextResponse.json({ error: "invalid feedback" }, { status: 422 });

  const entry = { ...feedback, receivedAt: new Date().toISOString() };
  console.log("[mikhyal-feedback]", JSON.stringify(entry));

  const hook = process.env.FEEDBACK_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(entry), signal: AbortSignal.timeout(5000) });
    } catch (e) {
      console.error("[mikhyal-feedback] webhook failed", e);
    }
  }
  return NextResponse.json({ ok: true });
}
