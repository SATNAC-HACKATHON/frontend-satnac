"use client";

import { chartPoints } from "@/lib/npm/derive";
import { snapshot } from "@/lib/npm/snapshot";
import { cn } from "@/lib/utils";

const WIDTH = 160;
const HEIGHT = 52;
const SCALE_MIN = 70;
const SCALE_MAX = 100;

function pathFor(values: number[]) {
  if (values.length < 2) return "";
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * WIDTH;
      const t = (value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
      const y = HEIGHT - Math.min(1, Math.max(0, t)) * HEIGHT;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function CellMultiples({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (cellId: string) => void;
}) {
  const cluster = snapshot.clusters[0];
  const leadSite = snapshot.cells.find((cell) => cell.status === "degraded")?.siteId;
  const stableCount = snapshot.cells.filter((cell) => cell.status === "stable").length;
  const cells = [...snapshot.cells].sort((a, b) => {
    const siteRank = Number(a.siteId !== leadSite) - Number(b.siteId !== leadSite);
    if (siteRank !== 0) return siteRank;
    const statusRank = Number(a.status !== "degraded") - Number(b.status !== "degraded");
    if (statusRank !== 0) return statusRank;
    return a.cellId.localeCompare(b.cellId);
  });

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-950">
        {stableCount} cells held their range. {snapshot.cells.length - stableCount === 1 ? "One did not." : `${snapshot.cells.length - stableCount} did not.`}
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
        Accessibility on one shared scale, 70% to 100%. The shaded band is the incident window, drawn only on the cell the pipeline clustered.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cells.map((cell) => {
          const points = chartPoints(cell.cellId);
          const values = points.map((point) => point.accessibility);
          const min = values.length ? Math.min(...values) : cell.minAccessibility;
          const degraded = cell.status === "degraded";
          const active = cell.cellId === activeId;
          const color = degraded ? "#be123c" : active ? "#0f172a" : "#64748b";
          const windowed = cluster && cluster.cellId === cell.cellId;
          const start = windowed ? points.findIndex((point) => point.t >= cluster.start) : -1;
          const end = windowed ? points.findIndex((point) => point.t > cluster.end) : -1;
          const x1 = start >= 0 ? (start / Math.max(points.length - 1, 1)) * WIDTH : 0;
          const endIndex = end === -1 ? points.length - 1 : Math.max(start, end - 1);
          const x2 = (endIndex / Math.max(points.length - 1, 1)) * WIDTH;

          return (
            <button
              key={cell.cellId}
              type="button"
              onClick={() => onSelect(cell.cellId)}
              aria-pressed={active}
              className={cn(
                "rounded-xl border bg-white p-3 text-left",
                active ? "border-slate-900" : degraded ? "border-rose-200" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-slate-900">{cell.cellId}</span>
                <span className="font-mono text-xs font-semibold tabular-nums" style={{ color }}>
                  {min.toFixed(1)}%
                </span>
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                {cell.city} · {cell.band}
                {degraded ? " · degraded" : ""}
              </span>
              <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 h-14 w-full" role="img" aria-label={`${cell.cellId} accessibility`}>
                <line x1="0" x2={WIDTH} y1={HEIGHT} y2={HEIGHT} stroke="#e6eaef" />
                {windowed && start >= 0 ? <rect x={x1} y="0" width={Math.max(0, x2 - x1)} height={HEIGHT} fill="#be123c" opacity="0.08" /> : null}
                <path d={pathFor(values)} fill="none" stroke={color} strokeWidth={degraded ? 1.8 : 1.25} vectorEffect="non-scaling-stroke" />
              </svg>
            </button>
          );
        })}
      </div>
    </section>
  );
}
