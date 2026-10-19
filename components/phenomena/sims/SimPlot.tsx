"use client";
import { Coordinates, Mafs } from "mafs";
import "mafs/core.css";

/** Small Mafs chart with axis titles, used under the simulations. */
export function SimPlot({
  x,
  y,
  xLabel,
  yLabel,
  xStep,
  yStep,
  height = 220,
  xFormat,
  yFormat,
  children,
  label,
}: {
  x: [number, number];
  y: [number, number];
  xLabel: string;
  yLabel: string;
  xStep: number;
  yStep: number;
  height?: number;
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <figure className="space-y-1" dir="ltr" aria-label={label}>
      <div className="flex justify-between text-xs font-semibold text-ink-3">
        <span>{yLabel}</span>
        <span>{label}</span>
      </div>
      <div className="mafs-mikhyal overflow-hidden rounded-[14px] border-2 border-border">
        <Mafs height={height} viewBox={{ x, y, padding: 0 }} preserveAspectRatio={false} pan={false} zoom={false}>
          <Coordinates.Cartesian
            xAxis={{ lines: xStep, labels: (v) => (xFormat ? xFormat(v) : String(+v.toPrecision(3))) }}
            yAxis={{ lines: yStep, labels: (v) => (yFormat ? yFormat(v) : String(+v.toPrecision(3))) }}
          />
          {children}
        </Mafs>
      </div>
      <figcaption className="text-end text-xs font-semibold text-ink-3">{xLabel}</figcaption>
    </figure>
  );
}
