"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Bot, Circle, CircleCheck, Lightbulb, PartyPopper, Redo2, RotateCcw, Undo2, X } from "lucide-react";
import type { Sandbox, SandboxLevel } from "@/lib/sandbox/types";
import { useSandbox, type SandboxApi } from "@/lib/sandbox/useSandbox";
import { tutorService } from "@/lib/api/services";
import type { TutorRequest, TutorResponse } from "@/lib/engine/tutor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { MathText } from "@/components/ui/MathText";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TutorPanel, type TutorMessage } from "@/components/lesson/TutorPanel";
import { cn } from "@/lib/utils";

/** Small confetti burst from an element; skipped for reduced motion. */
function burst(from: HTMLElement | null) {
  if (!from || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#5146e8", "#12a889", "#f4b544", "#e5484d"];
  const box = from.getBoundingClientRect();
  for (let i = 0; i < 22; i++) {
    const dot = document.createElement("span");
    Object.assign(dot.style, {
      position: "fixed",
      left: `${box.left + box.width / 2}px`,
      top: `${box.top + 24}px`,
      width: "9px",
      height: "9px",
      borderRadius: i % 3 ? "50%" : "2px",
      background: colors[i % colors.length],
      zIndex: "60",
      pointerEvents: "none",
    });
    document.body.appendChild(dot);
    const a = (i / 22) * Math.PI * 2;
    gsap.to(dot, {
      x: Math.cos(a) * (80 + Math.random() * 90),
      y: Math.sin(a) * (60 + Math.random() * 80) - 40,
      rotate: Math.random() * 360,
      opacity: 0,
      duration: 1 + Math.random() * 0.4,
      ease: "power2.out",
      onComplete: () => dot.remove(),
    });
  }
}

export function SandboxShell<S, Sol>({
  sandbox,
  renderBoard,
  renderSide,
}: {
  sandbox: Sandbox<S, Sol>;
  renderBoard: (api: SandboxApi<S, Sol>, level: SandboxLevel<S, Sol>) => React.ReactNode;
  renderSide?: (api: SandboxApi<S, Sol>, level: SandboxLevel<S, Sol>) => React.ReactNode;
}) {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = sandbox.levels[levelIdx];
  const api = useSandbox(sandbox, level);
  const [hintLevel, setHintLevel] = useState(0);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const goalsRef = useRef<HTMLDivElement>(null);
  const wasSolved = useRef(false);

  useEffect(() => {
    setHintLevel(0);
    setMessages([]);
    wasSolved.current = false;
  }, [levelIdx]);

  useEffect(() => {
    if (api.solved && !wasSolved.current) burst(goalsRef.current);
    wasSolved.current = api.solved;
  }, [api.solved]);

  // Ctrl/Cmd+Z, Ctrl+Shift+Z / Ctrl+Y
  const { undo, redo } = api;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const solvedIds = new Set(api.progress[sandbox.id] ?? []);
  if (api.solved) solvedIds.add(level.id);
  const unmet = level.goals.filter((_, i) => !api.goalStatus[i]).map((g) => g.label);

  const askTutor = async (message?: string) => {
    if (message) setMessages((m) => [...m, { role: "student", text: message }]);
    setBusy(true);
    try {
      const req: TutorRequest = {
        sandboxId: sandbox.id,
        levelId: level.id,
        step: "sandbox",
        message,
        hintLevel,
        context: `${api.describe()} | Unmet goals: ${unmet.join(" ; ") || "none"}`,
        history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
      };
      const data: TutorResponse = await tutorService.ask(req);
      setHintLevel(data.hintLevel);
      setMessages((m) => [...m, { role: "tutor", text: data.reply, source: data.source }]);
    } catch {
      const text = level.hints[Math.min(hintLevel, level.hints.length - 1)];
      setHintLevel((h) => Math.min(h + 1, level.hints.length));
      setMessages((m) => [...m, { role: "tutor", text, source: "rules" }]);
    } finally {
      setBusy(false);
    }
  };

  const iconBtn = (label: string, onClick: () => void, disabled: boolean, icon: React.ReactNode) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon-sm" onClick={onClick} disabled={disabled} aria-label={label}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b-2 border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5">
          <div className="hidden sm:block">
            <Logo href="/play" />
          </div>
          <Button asChild variant="outline" size="icon-sm" className="sm:hidden">
            <Link href="/play" aria-label="رجوع لملعب التجارب">
              <X />
            </Link>
          </Button>
          <nav className="flex flex-1 items-center gap-1.5 overflow-x-auto py-1" aria-label="المستويات">
            {sandbox.levels.map((l, i) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLevelIdx(i)}
                aria-current={i === levelIdx ? "step" : undefined}
                aria-label={`المستوى ${i + 1}: ${l.title}${solvedIds.has(l.id) ? " (اتحل)" : ""}`}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full border-2 font-latin text-sm font-bold transition-colors",
                  i === levelIdx ? "border-primary bg-primary text-white" : solvedIds.has(l.id) ? "border-mint bg-mint-soft text-mint-dark" : "border-line-strong bg-surface text-ink-3",
                )}
              >
                {solvedIds.has(l.id) && i !== levelIdx ? <CircleCheck className="size-5" /> : i + 1}
              </button>
            ))}
          </nav>
          <Badge className="hidden md:inline-flex">{sandbox.title}</Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] gap-5 px-4 py-5 lg:grid-cols-[minmax(320px,400px)_1fr]">
        <section className="space-y-4 rounded-[20px] border-2 border-border bg-card p-5 lg:self-start" aria-labelledby="level-title">
          <p className="text-sm font-semibold text-ink-3">
            المستوى {levelIdx + 1} من {sandbox.levels.length}
            {level.freeBuild ? " · ملعب حر" : ""}
          </p>
          <h1 id="level-title" className="font-display text-[26px] font-extrabold leading-tight text-ink">
            {level.title}
          </h1>
          <p className="text-[17px] leading-8 text-ink">
            <MathText>{level.story.replace(/\*\*/g, "")}</MathText>
          </p>

          <div ref={goalsRef} className="space-y-2 rounded-[16px] border-2 border-border bg-muted/50 p-3" aria-live="polite">
            <p className="text-sm font-bold text-ink-2">الأهداف</p>
            <ul className="space-y-1.5">
              {level.goals.map((g, i) => (
                <li key={g.id} className={cn("flex items-start gap-2 text-[15px] leading-7", api.goalStatus[i] ? "text-mint-dark" : "text-ink-2")}>
                  {api.goalStatus[i] ? <CircleCheck className="mt-1 size-5 shrink-0" aria-label="اتحقق" /> : <Circle className="mt-1 size-5 shrink-0 text-ink-3" aria-label="لسه" />}
                  <MathText>{g.label}</MathText>
                </li>
              ))}
            </ul>
          </div>

          {api.solved && (
            <Alert variant="mint" className="pop-in">
              <PartyPopper />
              <AlertTitle>حلّيتها!</AlertTitle>
              <AlertDescription className="text-ink">
                <MathText>{level.takeaway}</MathText>
              </AlertDescription>
            </Alert>
          )}

          {hintLevel > 0 && !api.solved && (
            <Alert variant="amber" className="pop-in">
              <Lightbulb />
              <AlertTitle>تلميح {hintLevel}</AlertTitle>
              <AlertDescription className="text-ink">
                <MathText>{level.hints[hintLevel - 1]}</MathText>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {iconBtn("تراجع (Ctrl+Z)", api.undo, !api.canUndo, <Undo2 />)}
            {iconBtn("إعادة (Ctrl+Shift+Z)", api.redo, !api.canRedo, <Redo2 />)}
            {iconBtn("ابدأ المستوى من الأول", api.reset, !api.canUndo, <RotateCcw />)}
            <div className="flex-1" />
            {!api.solved && (
              <Button variant="amber" size="sm" onClick={() => setHintLevel((h) => Math.min(h + 1, level.hints.length))} disabled={hintLevel >= level.hints.length}>
                <Lightbulb /> تلميح
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setTutorOpen(true)}>
              <Bot /> اسأل مِخيال
            </Button>
          </div>

          {api.solved && levelIdx < sandbox.levels.length - 1 && (
            <Button variant="mint" className="w-full" onClick={() => setLevelIdx(levelIdx + 1)}>
              المستوى الجاي <ArrowLeft />
            </Button>
          )}
          {api.solved && levelIdx === sandbox.levels.length - 1 && (
            <Button asChild className="w-full">
              <Link href="/play">
                رجوع لملعب التجارب <ArrowLeft />
              </Link>
            </Button>
          )}
        </section>

        <section className="space-y-4" aria-label="مساحة البناء">
          {renderBoard(api, level)}
          {renderSide && <div className="rounded-[20px] border-2 border-border bg-card p-4">{renderSide(api, level)}</div>}
        </section>
      </main>

      <TutorPanel open={tutorOpen} onOpenChange={setTutorOpen} messages={messages} busy={busy} onSend={(t) => askTutor(t)} onHint={() => askTutor()} />
    </div>
  );
}
