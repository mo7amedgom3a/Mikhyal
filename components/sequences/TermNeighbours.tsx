"use client";
import { useState } from "react";
import { Tex } from "@/components/ui/Tex";
import { cn } from "@/lib/utils";

const TERMS = [1, 3, 5, 7, 9, 11, 13];

/** "تذكّر": click any term to make it a_n and see a_{n-1} and a_{n+1} around it. */
export function TermNeighbours() {
  const [n, setN] = useState(3);
  const role = (i: number) => (i === n ? "n" : i === n - 1 ? "n-1" : i === n + 1 ? "n+1" : null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-2" dir="ltr" role="radiogroup" aria-label="اختر الحد">
        {TERMS.map((t, k) => {
          const i = k + 1;
          const r = role(i);
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === n}
              onClick={() => setN(i)}
              className={cn(
                "flex w-16 flex-col items-center gap-1 rounded-[14px] border-2 px-2 py-2 transition-colors",
                r === "n" ? "border-primary bg-primary text-white" : r ? "border-amber bg-amber-soft text-ink" : "border-border bg-surface text-ink-2 hover:border-primary",
              )}
            >
              <span className="font-latin text-2xl font-bold">{t}</span>
              <span className="text-sm">
                <Tex>{`a_{${i}}`}</Tex>
              </span>
              <span className="h-5 text-xs font-bold">{r && <Tex>{`a_{${r}}`}</Tex>}</span>
            </button>
          );
        })}
        <span className="self-center font-latin text-2xl text-ink-3">…</span>
      </div>
      <p className="text-center text-[15px] leading-7 text-ink-2">
        اضغط على أي حد. الحد المختار هو <Tex>{"a_n"}</Tex> (هنا <Tex>{`n = ${n}`}</Tex>)، والذي قبله مباشرة <Tex>{"a_{n-1}"}</Tex>
        {n > 1 ? (
          <>
            {" "}= <Tex>{`a_{${n - 1}} = ${TERMS[n - 2]}`}</Tex>
          </>
        ) : (
          " (لا يوجد قبل الحد الأول!)"
        )}
        ، والذي بعده <Tex>{"a_{n+1}"}</Tex>
        {n < TERMS.length ? (
          <>
            {" "}= <Tex>{`a_{${n + 1}} = ${TERMS[n]}`}</Tex>
          </>
        ) : null}
        .
      </p>
    </div>
  );
}
