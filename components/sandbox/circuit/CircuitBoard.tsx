"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { Eraser, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { allEdges, edgeNodes, place, remaining, removePart, toggleSwitch, type CircuitState, type Part, type PartType } from "@/lib/sandbox/circuit/model";
import type { CircuitSolution } from "@/lib/sandbox/circuit/solver";
import type { SandboxLevel } from "@/lib/sandbox/types";
import type { SandboxApi } from "@/lib/sandbox/useSandbox";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";

const S = 120; // px between nodes
const PAD = 70;
type Tool = PartType | "erase";

const TOOL_LABEL: Record<Tool, string> = {
  wire: "سلك",
  bulb: "لمبة",
  resistor: "مقاومة",
  switch: "مفتاح",
  battery: "بطارية",
  erase: "مسح",
};

const nodeXY = (id: string) => {
  const [c, r] = id.split(",").map(Number);
  return { x: PAD + c * S, y: PAD + r * S };
};
const edgeGeom = (edge: string) => {
  const [a, b] = edgeNodes(edge).map(nodeXY);
  return { a, b, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, vertical: edge.startsWith("v") };
};

/* ---------- part glyphs (drawn along +x, centred at 0) ---------- */

function Leads({ gap }: { gap: number }) {
  return (
    <g stroke="#172234" strokeWidth="4" strokeLinecap="round">
      <line x1={-S / 2} y1="0" x2={-gap} y2="0" />
      <line x1={gap} y1="0" x2={S / 2} y2="0" />
    </g>
  );
}

function BatteryGlyph({ flipped, short }: { flipped?: boolean; short: boolean }) {
  return (
    <g>
      <Leads gap={26} />
      <g transform={flipped ? "scale(-1,1)" : undefined}>
        <rect x="-26" y="-13" width="48" height="26" rx="6" fill="#3b4558" stroke={short ? "var(--danger)" : "#172234"} strokeWidth="2.5" />
        <rect x="10" y="-13" width="14" height="26" rx="4" fill="var(--brand-insight)" />
        <rect x="24" y="-6" width="5" height="12" rx="2" fill="#172234" />
        <text x="-14" y="5" fontSize="13" fontWeight="700" fill="#fff" fontFamily="var(--font-latin)">−</text>
        <text x="13" y="5" fontSize="12" fontWeight="700" fill="#172234" fontFamily="var(--font-latin)">+</text>
      </g>
      {short && <circle r="34" fill="none" stroke="var(--danger)" strokeWidth="3" className="motion-safe:animate-ping" style={{ transformOrigin: "center", transformBox: "fill-box" }} />}
    </g>
  );
}

function ResistorGlyph() {
  return (
    <g>
      <Leads gap={26} />
      <polyline points="-26,0 -20,-11 -10,11 0,-11 10,11 20,-11 26,0" fill="none" stroke="var(--brand-primary)" strokeWidth="4" strokeLinejoin="round" />
    </g>
  );
}

function SwitchGlyph({ closed }: { closed?: boolean }) {
  return (
    <g>
      <Leads gap={22} />
      <circle cx="-22" cy="0" r="5" fill="#172234" />
      <circle cx="22" cy="0" r="5" fill="#fff" stroke="#172234" strokeWidth="3" />
      <line x1="-22" y1="0" x2={closed ? 20 : 14} y2={closed ? 0 : -22} stroke="var(--brand-primary)" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

/** Bulb glyph is drawn upright (not rotated with the edge) so the glass and label stay readable. */
function BulbGlyph({ brightness, label, goal }: { brightness: number; label?: string; goal?: "met" | "unmet" }) {
  const glow = Math.min(1, Math.sqrt(Math.max(0, brightness)));
  return (
    <g>
      {goal && <rect x="-30" y="-34" width="60" height="64" rx="10" fill="none" stroke={goal === "met" ? "var(--brand-discovery)" : "#cfd6e4"} strokeWidth="2.5" />}
      <circle r={22 + glow * 26} fill="var(--brand-insight)" opacity={glow * 0.45} />
      <circle r="19" cy="-4" style={{ fill: glow > 0.02 ? `color-mix(in srgb, var(--brand-insight) ${35 + glow * 65}%, #fff)` : "#fff" }} stroke="#172234" strokeWidth="2.5" />
      <path d="M-6 -4 q3 -8 6 0 q3 8 6 0" fill="none" stroke={glow > 0.02 ? "#b07a12" : "#9aa5b8"} strokeWidth="2" />
      <rect x="-9" y="14" width="18" height="9" rx="2" fill="#6b7a99" />
      {label && (
        <text x="0" y="-28" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--foreground)" fontFamily="var(--font-latin)">
          {label}
        </text>
      )}
      {goal === "met" && (
        <g transform="translate(26,-30)">
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill="var(--brand-discovery)" />
          <path d="M-4.5 0.5 l3 3 l6 -7" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

function PartGlyph({ part, edge, reading, short, goal }: { part: Part; edge: string; reading?: CircuitSolution["readings"][string]; short: boolean; goal?: "met" | "unmet" }) {
  const g = edgeGeom(edge);
  const rot = g.vertical ? 90 : 0;
  if (part.type === "wire") return <line x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y} stroke="#172234" strokeWidth="4" strokeLinecap="round" />;
  if (part.type === "bulb") {
    return (
      <g>
        <g transform={`translate(${g.mx},${g.my}) rotate(${rot})`}>
          <Leads gap={20} />
        </g>
        <g transform={`translate(${g.mx},${g.my})`}>
          <BulbGlyph brightness={short ? 0 : reading?.brightness ?? 0} label={part.label} goal={goal} />
        </g>
      </g>
    );
  }
  return (
    <g transform={`translate(${g.mx},${g.my}) rotate(${rot})`}>
      {part.type === "battery" && <BatteryGlyph flipped={part.flipped} short={short} />}
      {part.type === "resistor" && <ResistorGlyph />}
      {part.type === "switch" && <SwitchGlyph closed={part.closed} />}
    </g>
  );
}

function TrayIcon({ type }: { type: Tool }) {
  if (type === "erase") return <Eraser className="size-6" aria-hidden />;
  const glyph: Record<PartType, React.ReactNode> = {
    wire: <line x1={-S / 2} y1="0" x2={S / 2} y2="0" stroke="#172234" strokeWidth="5" strokeLinecap="round" />,
    bulb: <BulbGlyph brightness={0.7} />,
    resistor: <ResistorGlyph />,
    switch: <SwitchGlyph closed />,
    battery: <BatteryGlyph short={false} />,
  };
  return (
    <svg viewBox={type === "bulb" ? "-36 -40 72 72" : "-62 -30 124 60"} className="h-8 w-14" aria-hidden>
      {glyph[type]}
    </svg>
  );
}

/* ---------- board ---------- */

export function CircuitBoard({ api, level }: { api: SandboxApi<CircuitState, CircuitSolution>; level: SandboxLevel<CircuitState, CircuitSolution> }) {
  const { state, solution, commit } = api;
  const svg = useRef<SVGSVGElement>(null);
  const edges = useMemo(() => allEdges(state.cols, state.rows), [state.cols, state.rows]);
  const tools = useMemo<Tool[]>(
    () => [...(["wire", "bulb", "resistor", "switch"] as PartType[]).filter((t) => (state.inventory[t] ?? 0) > 0), "erase"],
    [state.inventory],
  );
  const [tool, setTool] = useState<Tool>(tools[0]);
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ type: PartType; x: number; y: number; target: string | null } | null>(null);
  const [announce, setAnnounce] = useState("");
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!tools.includes(tool)) setTool(tools[0]);
  }, [tools, tool]);

  // Current-flow animation: dots advance in proportion to each part's current.
  useEffect(() => {
    if (reduced || solution.shortCircuit) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      setPhase((p) => (p + (now - last) / 1000) % 1000);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, solution.shortCircuit]);

  const goalByLabel = useMemo(() => {
    const m: Record<string, "met" | "unmet"> = {};
    level.goals.forEach((g, i) => {
      if (g.anchor) m[g.anchor] = m[g.anchor] === "unmet" ? "unmet" : api.goalStatus[i] ? "met" : "unmet";
    });
    return m;
  }, [level.goals, api.goalStatus]);

  const width = PAD * 2 + (state.cols - 1) * S;
  const height = PAD * 2 + (state.rows - 1) * S;

  const describeEdge = (edge: string) => {
    const p = state.parts[edge];
    const [a, b] = edgeNodes(edge);
    if (!p) return `حافة فاضية بين ${a} و ${b}`;
    const r = solution.readings[edge];
    const extra = p.type === "bulb" ? (r?.lit ? ` منورة ${Math.round((r.brightness ?? 0) * 100)}%` : " طافية") : p.type === "switch" ? (p.closed ? " مقفول" : " مفتوح") : "";
    return `${TOOL_LABEL[p.type]}${p.label ? " " + p.label : ""}${extra}${p.locked ? " (ثابت)" : ""}`;
  };

  /** Tap / Enter on an edge with the current tool. */
  const activate = (edge: string, withTool: Tool = tool) => {
    const p = state.parts[edge];
    if (!p) {
      if (withTool !== "erase") {
        if (remaining(state, withTool) <= 0) return setAnnounce(`خلصت كل ${TOOL_LABEL[withTool]}ات`);
        commit(place(state, edge, withTool));
        setAnnounce(`حطيت ${TOOL_LABEL[withTool]}`);
      }
      return;
    }
    if (p.type === "switch" && withTool !== "erase") {
      commit(toggleSwitch(state, edge));
      return setAnnounce(p.closed ? "فتحت المفتاح" : "قفلت المفتاح");
    }
    if (!p.locked && (withTool === "erase" || withTool === p.type)) {
      commit(removePart(state, edge));
      setAnnounce(`شلت ${TOOL_LABEL[p.type]}`);
    }
  };

  const toSvg = (cx: number, cy: number) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };
  const nearestFreeEdge = (x: number, y: number) => {
    let best: string | null = null;
    let bd = 48;
    for (const e of edges) {
      if (state.parts[e]) continue;
      const g = edgeGeom(e);
      const d = Math.hypot(g.mx - x, g.my - y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  };

  // Drag a part from the tray onto the board (a tap just selects the tool).
  const bindTray = useDrag(
    ({ args: [type], xy: [cx, cy], first, last, tap }) => {
      const t = type as Tool;
      if (tap) {
        setTool(t);
        return;
      }
      if (t === "erase") return;
      const p = toSvg(cx, cy);
      const target = p ? nearestFreeEdge(p.x, p.y) : null;
      if (first || !last) setGhost({ type: t, x: cx, y: cy, target });
      if (last) {
        setGhost(null);
        setTool(t);
        if (target) activate(target, t);
      }
    },
    { filterTaps: true, pointer: { capture: true } },
  );

  const onKey = (e: React.KeyboardEvent) => {
    setFocused(true);
    const n = edges.length;
    if (["ArrowRight", "ArrowDown"].includes(e.key)) setCursor((c) => (c + 1) % n);
    else if (["ArrowLeft", "ArrowUp"].includes(e.key)) setCursor((c) => (c - 1 + n) % n);
    else if (e.key === "Enter" || e.key === " ") activate(edges[cursor]);
    else if (e.key === "Delete" || e.key === "Backspace") activate(edges[cursor], "erase");
    else if (/^[1-9]$/.test(e.key) && tools[Number(e.key) - 1]) setTool(tools[Number(e.key) - 1]);
    else return;
    e.preventDefault();
  };
  useEffect(() => {
    if (focused) setAnnounce(describeEdge(edges[cursor]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, focused, state]);

  const flowDots = (edge: string) => {
    const r = solution.readings[edge];
    const I = r?.current ?? 0;
    if (solution.shortCircuit || Math.abs(I) < 1e-4) return null;
    const g = edgeGeom(edge);
    const len = S;
    const spacing = 30;
    const offset = ((phase * Math.min(3, Math.abs(I)) * 70) % spacing) * Math.sign(I);
    const dots = [];
    for (let s = -spacing; s <= len + spacing; s += spacing) {
      const t = (s + offset) / len;
      if (t < 0.02 || t > 0.98) continue;
      dots.push(<circle key={s} cx={g.a.x + (g.b.x - g.a.x) * t} cy={g.a.y + (g.b.y - g.a.y) * t} r="3.5" fill="var(--brand-discovery)" />);
    }
    return <g key={`f-${edge}`}>{dots}</g>;
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[20px] border-2 border-border bg-surface" dir="ltr">
        {solution.shortCircuit && (
          <div role="alert" className="pop-in absolute inset-x-3 top-3 z-10 flex items-center gap-2 rounded-[14px] border-2 border-destructive bg-danger-soft px-3 py-2 text-sm font-bold text-destructive" dir="rtl">
            <TriangleAlert className="size-5 shrink-0" /> قِصَر! السلك وصّل طرفين البطارية مباشرة — التيار كبير جدًا واللمبات طفت.
          </div>
        )}
        <svg
          ref={svg}
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full touch-none select-none outline-none"
          tabIndex={0}
          role="application"
          aria-label="لوحة بناء الدوائر. استخدم الأسهم للتنقل بين الحواف، وEnter للتركيب، وDelete للمسح، والأرقام لاختيار القطعة."
          onKeyDown={onKey}
          onKeyUp={(e) => e.key === "Tab" && setFocused(true)}
          onPointerDown={() => setFocused(false)}
          onBlur={() => setFocused(false)}
        >
          <rect width={width} height={height} fill="#fbfcff" />
          {/* empty edges: dotted, clickable */}
          {edges.map((e) => {
            if (state.parts[e]) return null;
            const g = edgeGeom(e);
            const target = ghost?.target === e || (hover === e && tool !== "erase");
            return (
              <g key={e} onClick={() => activate(e)} onPointerEnter={() => setHover(e)} onPointerLeave={() => setHover((h) => (h === e ? null : h))} style={{ cursor: tool === "erase" ? "default" : "copy" }}>
                <line x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y} stroke={target ? "var(--brand-primary)" : "#aab3c5"} strokeWidth={target ? 4 : 3} strokeDasharray={target ? "8 6" : "1 9"} strokeLinecap="round" />
                <line x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y} stroke="transparent" strokeWidth="30" data-edge={e} />
              </g>
            );
          })}
          {/* nodes */}
          {Array.from({ length: state.cols * state.rows }, (_, i) => {
            const { x, y } = nodeXY(`${i % state.cols},${Math.floor(i / state.cols)}`);
            return <circle key={i} cx={x} cy={y} r="3.5" fill="#aab3c5" />;
          })}
          {/* flow under parts */}
          {Object.keys(state.parts).map(flowDots)}
          {/* placed parts */}
          {Object.entries(state.parts).map(([e, p]) => (
            <g
              key={e}
              data-part={p.label ?? p.type}
              data-edge={e}
              onClick={() => activate(e)}
              style={{ cursor: p.type === "switch" || (!p.locked && (tool === "erase" || tool === p.type)) ? "pointer" : "default" }}
              className={cn(!p.locked && "[&:hover]:opacity-80")}
            >
              <line x1={edgeGeom(e).a.x} y1={edgeGeom(e).a.y} x2={edgeGeom(e).b.x} y2={edgeGeom(e).b.y} stroke="transparent" strokeWidth="30" />
              <PartGlyph part={p} edge={e} reading={solution.readings[e]} short={solution.shortCircuit} goal={p.label ? goalByLabel[p.label] : undefined} />
              {!p.locked && <circle cx={edgeGeom(e).mx} cy={edgeGeom(e).my} r="4" fill="var(--brand-primary)" opacity="0.7" />}
            </g>
          ))}
          {/* keyboard cursor */}
          {focused && (() => {
            const g = edgeGeom(edges[cursor]);
            return <rect x={g.mx - 34} y={g.my - 34} width="68" height="68" rx="12" fill="none" stroke="var(--brand-primary)" strokeWidth="3" strokeDasharray="6 4" />;
          })()}
        </svg>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>

      {/* inventory tray */}
      <div className="flex flex-wrap items-stretch gap-2" role="toolbar" aria-label="القطع المتاحة">
        {tools.map((t, i) => {
          const left = t === "erase" ? null : remaining(state, t);
          return (
            <button
              key={t}
              type="button"
              {...bindTray(t)}
              aria-pressed={tool === t}
              aria-label={`${TOOL_LABEL[t]}${left !== null ? `، متبقي ${left}` : ""} (مفتاح ${i + 1})`}
              data-tool={t}
              className={cn(
                "flex min-h-14 touch-none select-none flex-col items-center justify-center gap-0.5 rounded-[14px] border-2 px-3 py-1.5 text-xs font-bold transition-[transform,box-shadow,background-color,border-color] active:translate-y-[2px]",
                tool === t ? "border-primary bg-primary-soft text-primary shadow-[0_4px_0_0_var(--brand-primary)]" : "border-line-strong bg-surface text-ink-2 shadow-[0_4px_0_0_var(--border-strong)]",
                left === 0 && "opacity-50",
              )}
            >
              <TrayIcon type={t} />
              <span>
                {TOOL_LABEL[t]}
                {left !== null && <span className="ltr ms-1 font-latin text-ink-3">×{left}</span>}
              </span>
            </button>
          );
        })}
        <p className="flex-1 basis-60 self-center text-xs leading-6 text-ink-3">
          اسحب قطعة على أي حافة بالنقط، أو اختارها ودوس على الحافة. دوس على المفتاح يفتح/يقفل. اختار «مسح» أو نفس القطعة ودوس عليها تشيلها.
        </p>
      </div>

      {ghost && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-[12px] border-2 border-primary bg-surface/90 p-1 shadow-lg" style={{ left: ghost.x, top: ghost.y }} aria-hidden>
          <TrayIcon type={ghost.type} />
        </div>
      )}
    </div>
  );
}

/** Live meter panel: brightness per bulb and battery current. */
export function CircuitReadouts({ api }: { api: SandboxApi<CircuitState, CircuitSolution> }) {
  const { state, solution } = api;
  const bulbs = Object.entries(state.parts).filter(([, p]) => p.type === "bulb");
  return (
    <div className="space-y-2.5">
      {bulbs.map(([e, p]) => {
        const r = solution.readings[e];
        const b = solution.shortCircuit ? 0 : Math.min(1, r?.brightness ?? 0);
        return (
          <div key={e} className="flex items-center gap-2 text-sm">
            <b className="ltr w-6 font-latin text-ink">{p.label}</b>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-amber transition-[width] duration-200" style={{ width: `${b * 100}%` }} />
            </div>
            <span className="ltr w-24 text-end font-latin text-xs text-ink-3">
              {Math.round(b * 100)}% · {Math.abs(r?.current ?? 0).toFixed(2)} A
            </span>
          </div>
        );
      })}
      <p className="ltr text-end font-latin text-xs text-ink-3">
        I<sub>battery</sub> = {solution.shortCircuit ? "∞" : solution.batteryCurrent.toFixed(2)} A · V = 6 V
      </p>
    </div>
  );
}
