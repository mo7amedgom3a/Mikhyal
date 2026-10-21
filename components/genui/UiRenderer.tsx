"use client";
import { createContext, useContext, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CircleCheck, Circle, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { UiBlock, UiSpec } from "@/lib/domain";
import { compileRule } from "@/lib/engines/outcomeRules";
import { Choice, sci, useObservations } from "@/components/phenomena/sims/SimFrame";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { cn } from "@/lib/utils";
import { SCENES } from "./scenes/registry";

const PlotBlock = dynamic(() => import("./blocks/PlotBlock"), { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-[14px] bg-surface" /> });

type SimValue = number | string | number[];
type SimState = Record<string, SimValue>;
const SimContext = createContext<SimState>({});

const numericScope = (s: SimState) => Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v === "number")) as Record<string, number>;

/** Renders a "genui/1" spec. Everything on screen comes from the spec; no lesson content lives here. */
export function UiRenderer({ spec }: { spec: UiSpec }) {
  return (
    <article className="space-y-6" data-genui={spec.version}>
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{spec.title}</h1>
        {spec.subtitle && <p className="text-lg text-ink-2">{spec.subtitle}</p>}
      </header>
      <Blocks blocks={spec.blocks} />
    </article>
  );
}

export function Blocks({ blocks }: { blocks: UiBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </>
  );
}

function Block({ block }: { block: UiBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? <h2 className="font-display text-2xl font-extrabold text-ink">{block.text}</h2> : <h3 className="text-xl font-bold text-ink">{block.text}</h3>;
    case "text":
      return (
        <p className="text-[17px] leading-8 text-ink-2" data-block="text">
          <MathText>{block.text}</MathText>
        </p>
      );
    case "callout":
      return <Callout {...block} />;
    case "equation":
      return (
        <figure className="overflow-x-auto rounded-[14px] border-2 border-border bg-surface px-4 py-3" data-block="equation">
          <div dir="ltr">
            <Tex block>{block.latex}</Tex>
          </div>
          {block.caption && <figcaption className="mt-1 text-center text-sm text-ink-3">{block.caption}</figcaption>}
        </figure>
      );
    case "timeline":
      return (
        <ol className="relative space-y-4 border-s-2 border-primary/30 ps-5" data-block="timeline">
          {block.items.map((it) => (
            <li key={it.year + it.title} className="relative">
              <span className="absolute -start-[29px] top-1.5 size-3.5 rounded-full border-2 border-primary bg-card" />
              <p className="text-sm font-bold text-primary">
                <span className="ltr font-latin">{it.year}</span>
              </p>
              <p className="font-bold text-ink">{it.title}</p>
              <p className="text-[15px] leading-7 text-ink-2">
                <MathText>{it.text}</MathText>
              </p>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <figure className="overflow-x-auto rounded-[14px] border-2 border-border" data-block="table">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                {block.columns.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-start font-bold text-ink">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {block.columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-ink-2">
                      <MathText>{String(r[c.key] ?? "")}</MathText>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && <figcaption className="border-t border-border px-3 py-2 text-xs text-ink-3">{block.caption}</figcaption>}
        </figure>
      );
    case "plot":
      return <BoundPlot block={block} />;
    case "scene":
      return <Scene block={block} />;
    case "quiz":
      return <Quiz block={block} />;
    case "sim":
      return <Sim block={block} />;
    case "section":
      return (
        <section id={block.id} className="scroll-mt-20 space-y-4 rounded-[20px] border-2 border-border bg-card p-4 sm:p-6" data-block="section">
          <h2 className="font-display text-2xl font-extrabold text-ink">{block.title}</h2>
          <Blocks blocks={block.children} />
        </section>
      );
  }
}

function Callout({ tone, title, text }: Extract<UiBlock, { type: "callout" }>) {
  const Icon = tone === "warning" ? TriangleAlert : tone === "insight" ? Lightbulb : Info;
  return (
    <aside className={cn("flex gap-3 rounded-[14px] border-2 p-4", tone === "warning" ? "border-destructive/30 bg-danger-soft" : tone === "insight" ? "border-mint/50 bg-mint-soft" : "border-primary/30 bg-primary-soft")} data-block="callout">
      <Icon className="mt-1 size-5 shrink-0 text-ink-2" />
      <div>
        <p className="font-bold text-ink">{title}</p>
        <p className="text-[15px] leading-7 text-ink-2">
          <MathText>{text}</MathText>
        </p>
      </div>
    </aside>
  );
}

function BoundPlot({ block }: { block: Extract<UiBlock, { type: "plot" }> }) {
  const state = useContext(SimContext);
  return <PlotBlock spec={block} scope={numericScope(state)} />;
}

function Scene({ block }: { block: Extract<UiBlock, { type: "scene" }> }) {
  const state = useContext(SimContext);
  const C = SCENES[block.component];
  if (!C) return <p className="text-sm text-destructive">مكوّن غير معروف: {block.component}</p>;
  const bound = Object.fromEntries(Object.entries(block.bind ?? {}).map(([prop, key]) => [prop, state[key]]).filter(([, v]) => v !== undefined));
  return (
    <figure className="space-y-1" data-block="scene" data-component={block.component}>
      {block.title && <figcaption className="text-sm font-bold text-ink-2">{block.title}</figcaption>}
      <div className="overflow-hidden rounded-[14px] border-2 border-border bg-sim" dir="ltr">
        <C {...block.props} {...bound} />
      </div>
    </figure>
  );
}

function Quiz({ block }: { block: Extract<UiBlock, { type: "quiz" }> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const right = picked === block.correctId;
  return (
    <div className="space-y-3 rounded-[16px] border-2 border-primary/30 bg-primary-soft/40 p-4" data-block="quiz">
      <p className="font-bold text-ink">
        <MathText>{block.question}</MathText>
      </p>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={block.question}>
        {block.options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={picked === o.id}
            data-option={o.id}
            onClick={() => setPicked(o.id)}
            className={cn(
              "rounded-[12px] border-2 px-3 py-2 text-start text-[15px] transition-colors",
              picked === o.id ? (right ? "border-mint bg-mint-soft" : "border-destructive/50 bg-danger-soft") : "border-border bg-card hover:border-primary/50",
            )}
          >
            <MathText>{o.label}</MathText>
          </button>
        ))}
      </div>
      {picked && (
        <p className={cn("rounded-[12px] px-3 py-2 text-[15px] leading-7", right ? "bg-mint-soft text-mint-dark" : "bg-danger-soft text-ink")} aria-live="polite" data-quiz-result={right ? "right" : "wrong"}>
          <MathText>{block.feedback[picked] ?? (right ? block.explanation : "فكّر تاني.")}</MathText>
          {right && block.feedback[picked] && (
            <>
              {" "}
              <MathText>{block.explanation}</MathText>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function initialState(block: Extract<UiBlock, { type: "sim" }>): SimState {
  const s: SimState = {};
  for (const p of block.params) s[p.key] = p.default;
  for (const c of block.choices ?? []) Object.assign(s, c.options[c.default]?.values ?? {});
  return s;
}

function Sim({ block }: { block: Extract<UiBlock, { type: "sim" }> }) {
  const [state, setState] = useState<SimState>(() => initialState(block));
  const [choice, setChoice] = useState<Record<string, number>>(() => Object.fromEntries((block.choices ?? []).map((c) => [c.key, c.default])));
  const scope = numericScope(state);
  const vars = Object.keys(scope);

  const evalNum = (expr: string) => {
    try {
      return Number(compileRule(expr, vars).evaluate(scope));
    } catch {
      return NaN;
    }
  };
  const readouts = block.readouts.map((r) => ({ ...r, value: evalNum(r.expr) }));
  const obsInput = useMemo(
    () => (block.observations ?? []).map((o, i) => ({ id: String(i), label: o.label, met: Boolean(evalNum(o.when)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(scope), block],
  );
  const observations = useObservations(obsInput);

  return (
    <SimContext.Provider value={state}>
      <div className="space-y-3 rounded-[20px] border-2 border-mint/50 bg-card p-3 sm:p-4" data-block="sim" data-sim-id={block.id}>
        <p className="font-display text-xl font-extrabold text-ink">{block.title}</p>
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(240px,300px)]">
          <div className="min-w-0 space-y-3">
            <Blocks blocks={block.children} />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-live="polite" data-readouts>
              {readouts.map((r) => (
                <li key={r.label} className="rounded-[12px] border-2 border-border bg-surface px-3 py-1.5" data-readout={r.label}>
                  <p className="text-xs text-ink-3">{r.label}</p>
                  <p className="overflow-x-auto text-base text-ink" dir="ltr">
                    <Tex>{`${sci(r.value, Math.max(2, r.digits + 1))}${r.unit ? `\\ \\text{${r.unit.replace(/%/g, "\\%")}}` : ""}`}</Tex>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 space-y-3">
            {block.choices?.map((c) => (
              <Choice
                key={c.key}
                label={c.label}
                value={String(choice[c.key])}
                options={c.options.map((o, i) => ({ value: String(i), label: o.label }))}
                onChange={(v) => {
                  const i = Number(v);
                  setChoice((s) => ({ ...s, [c.key]: i }));
                  setState((s) => ({ ...s, ...c.options[i].values }));
                }}
              />
            ))}
            {block.params.map((p) => (
              <VariableSlider key={p.key} param={p} value={Number(state[p.key])} onChange={(v) => setState((s) => ({ ...s, [p.key]: v }))} />
            ))}
            {observations.length > 0 && (
              <div className="rounded-[14px] border-2 border-border bg-surface p-3">
                <p className="mb-2 text-sm font-bold text-ink">جرّب بنفسك</p>
                <ul className="space-y-1.5" data-observations>
                  {observations.map((o) => (
                    <li key={o.id} className={cn("flex items-start gap-2 text-sm leading-6", o.done ? "text-mint-dark" : "text-ink-2")} data-done={o.done ? "true" : "false"}>
                      {o.done ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <Circle className="mt-0.5 size-4 shrink-0 text-ink-3" />}
                      <MathText>{o.label}</MathText>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </SimContext.Provider>
  );
}
