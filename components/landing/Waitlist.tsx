"use client";
import { useState } from "react";
import { GraduationCap, PartyPopper, School, Send, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ROLES = [
  { id: "student", label: "طالب", icon: GraduationCap },
  { id: "parent", label: "ولي أمر", icon: Users },
  { id: "teacher", label: "مدرس", icon: UserRound },
  { id: "school", label: "مدرسة / سنتر", icon: School },
];

export function Waitlist() {
  const [role, setRole] = useState(ROLES[0].id);
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="pop-in flex flex-col items-center rounded-[20px] border-2 border-mint bg-mint-soft p-6 text-center">
        <PartyPopper className="size-10 text-mint-dark" aria-hidden />
        <p className="mt-2 text-lg font-bold text-mint-dark">اتسجلت في قائمة الانتظار!</p>
        <p className="text-sm text-ink-2">(نسخة تجريبية: البيانات محفوظة على جهازك بس لحد ما نربط الخادم.)</p>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
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
      <ToggleGroup type="single" value={role} onValueChange={(v) => v && setRole(v)} className="grid-cols-2 sm:grid-cols-4" aria-label="انت مين؟">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <ToggleGroupItem key={r.id} value={r.id} className="min-h-12 text-sm">
              <Icon /> {r.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="رقم الموبايل أو الإيميل" aria-label="رقم الموبايل أو الإيميل" />
        <Button type="submit">
          <Send className="-scale-x-100" /> سجّلني
        </Button>
      </div>
    </form>
  );
}
