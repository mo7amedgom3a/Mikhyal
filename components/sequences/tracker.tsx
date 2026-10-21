"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/** What the student actually did in the lesson, attached to their feedback. */
export interface LessonActivity {
  simsUsed: string[];
  practice: Record<string, { attempts: number; correct: boolean }>;
}

interface Tracker {
  activity: LessonActivity;
  startedAt: number;
  markSim: (id: string) => void;
  recordAttempt: (questionId: string, correct: boolean) => void;
}

const Ctx = createContext<Tracker | null>(null);

export function LessonTrackerProvider({ children }: { children: React.ReactNode }) {
  const [activity, setActivity] = useState<LessonActivity>({ simsUsed: [], practice: {} });
  const startedAt = useRef(Date.now()).current;
  const markSim = useCallback((id: string) => setActivity((a) => (a.simsUsed.includes(id) ? a : { ...a, simsUsed: [...a.simsUsed, id] })), []);
  const recordAttempt = useCallback(
    (questionId: string, correct: boolean) =>
      setActivity((a) => {
        const prev = a.practice[questionId] ?? { attempts: 0, correct: false };
        return { ...a, practice: { ...a.practice, [questionId]: { attempts: prev.attempts + 1, correct: prev.correct || correct } } };
      }),
    [],
  );
  const value = useMemo(() => ({ activity, startedAt, markSim, recordAttempt }), [activity, startedAt, markSim, recordAttempt]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLessonTracker(): Tracker {
  const t = useContext(Ctx);
  if (!t) throw new Error("useLessonTracker outside LessonTrackerProvider");
  return t;
}
