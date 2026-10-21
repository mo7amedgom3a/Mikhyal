/**
 * Lesson feedback from real students (MVP validation). Sanitised on the server before it is
 * logged or forwarded, so a malformed or oversized post cannot pollute the collected data.
 */

export type Scale = 1 | 2 | 3 | 4 | 5;

export interface LessonFeedback {
  lessonId: string;
  /** Optional first name or nickname; feedback is anonymous by default. */
  name?: string;
  /** Self-rated understanding before and after the lesson. */
  understandingBefore: Scale;
  understandingAfter: Scale;
  /** How much the simulations helped. */
  simsHelpful: Scale;
  /** Compared with the usual class explanation. */
  versusClass: "better" | "same" | "worse";
  favourite?: string;
  confusing?: string;
  comment?: string;
  /** What the student actually did on the page, collected automatically. */
  activity: {
    secondsOnPage: number;
    simsUsed: string[];
    practice: Record<string, { attempts: number; correct: boolean }>;
  };
}

const SCALE = (v: unknown): Scale | null => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? (v as Scale) : null);
const TEXT = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const ID = /^[a-z0-9-]{1,40}$/;

export function sanitizeFeedback(raw: unknown): LessonFeedback | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const before = SCALE(r.understandingBefore);
  const after = SCALE(r.understandingAfter);
  const sims = SCALE(r.simsHelpful);
  if (typeof r.lessonId !== "string" || !ID.test(r.lessonId) || !before || !after || !sims) return null;
  if (r.versusClass !== "better" && r.versusClass !== "same" && r.versusClass !== "worse") return null;

  const a = (r.activity && typeof r.activity === "object" ? r.activity : {}) as Record<string, unknown>;
  const practice: LessonFeedback["activity"]["practice"] = {};
  if (a.practice && typeof a.practice === "object")
    for (const [k, v] of Object.entries(a.practice as Record<string, unknown>).slice(0, 30)) {
      if (!ID.test(k) || !v || typeof v !== "object") continue;
      const p = v as Record<string, unknown>;
      practice[k] = { attempts: Math.max(0, Math.min(999, Math.floor(Number(p.attempts) || 0))), correct: p.correct === true };
    }

  return {
    lessonId: r.lessonId,
    name: TEXT(r.name, 60),
    understandingBefore: before,
    understandingAfter: after,
    simsHelpful: sims,
    versusClass: r.versusClass,
    favourite: TEXT(r.favourite, 1000),
    confusing: TEXT(r.confusing, 1000),
    comment: TEXT(r.comment, 2000),
    activity: {
      secondsOnPage: Math.max(0, Math.min(86_400, Math.floor(Number(a.secondsOnPage) || 0))),
      simsUsed: Array.isArray(a.simsUsed) ? a.simsUsed.filter((s): s is string => typeof s === "string" && ID.test(s)).slice(0, 20) : [],
      practice,
    },
  };
}
