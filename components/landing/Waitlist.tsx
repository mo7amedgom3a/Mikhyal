"use client";
import { useState } from "react";

const ROLES = ["طالب", "ولي أمر", "مدرس", "مدرسة / سنتر"];

export function Waitlist() {
  const [role, setRole] = useState(ROLES[0]);
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="pop-in rounded-[20px] border-2 border-mint bg-mint-soft p-6 text-center">
        <p className="text-3xl">🎉</p>
        <p className="mt-1 text-lg font-bold text-mint-dark">اتسجلت في قائمة الانتظار!</p>
        <p className="text-sm text-ink-2">(نسخة تجريبية: البيانات محفوظة على جهازك بس لحد ما نربط الخادم.)</p>
      </div>
    );
  }
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const list = JSON.parse(localStorage.getItem("mikhyal.waitlist") ?? "[]");
          localStorage.setItem("mikhyal.waitlist", JSON.stringify([...list, { role, contact, at: Date.now() }]));
        } catch {
          // ignore storage failures in the prototype
        }
        setDone(true);
      }}
    >
      <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="انت مين؟">
        {ROLES.map((r) => (
          <button
            type="button"
            key={r}
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={`rounded-[12px] border-2 px-4 py-2 text-sm font-bold ${role === r ? "border-primary bg-primary-soft text-primary" : "border-line-strong bg-surface text-ink-2"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="رقم الموبايل أو الإيميل"
          aria-label="رقم الموبايل أو الإيميل"
          className="min-h-12 flex-1 rounded-[14px] border-2 border-line-strong bg-surface px-4 text-ink focus:border-primary"
        />
        <button className="btn btn-primary" type="submit">
          سجّلني
        </button>
      </div>
    </form>
  );
}
