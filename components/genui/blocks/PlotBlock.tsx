"use client";
import { Plot, Point, Theme } from "mafs";
import type { UiBlock } from "@/lib/domain";
import { compileRule } from "@/lib/engines/outcomeRules";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";

type PlotSpec = Extract<UiBlock, { type: "plot" }>;
const PALETTE = [Theme.blue, Theme.orange, Theme.green, Theme.pink];

const niceStep = (span: number) => {
  const raw = span / 6;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? p * 10;
};

/** A Mafs plot whose series are whitelisted expressions in x (plus any bound sim values). */
export default function PlotBlock({ spec, scope }: { spec: PlotSpec; scope: Record<string, number> }) {
  const vars = ["x", ...Object.keys(scope)];
  const series = spec.series.flatMap((s, i) => {
    try {
      const f = compileRule(s.expr, vars);
      return [{ ...s, color: s.color ?? PALETTE[i % PALETTE.length], fn: (x: number) => Number(f.evaluate({ ...scope, x })) }];
    } catch {
      return [];
    }
  });
  return (
    <div className="space-y-2" data-block="plot">
      <SimPlot label={spec.title} x={spec.x} y={spec.y} xLabel={spec.xLabel} yLabel={spec.yLabel} xStep={niceStep(spec.x[1] - spec.x[0])} yStep={niceStep(spec.y[1] - spec.y[0])} height={240}>
        {series.map((s) => (
          <Plot.OfX key={s.expr} y={(x) => { const v = s.fn(x); return Number.isFinite(v) ? v : NaN; }} color={s.color} />
        ))}
        {spec.points?.map((p, i) => <Point key={i} x={p.x} y={p.y} color={Theme.red} />)}
      </SimPlot>
      <ul className="flex flex-wrap gap-3 text-xs text-ink-2">
        {series.map((s) => (
          <li key={s.expr} className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-4 rounded" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
        {spec.points?.length ? (
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: Theme.red }} />
            بيانات مُقاسة
          </li>
        ) : null}
      </ul>
    </div>
  );
}
