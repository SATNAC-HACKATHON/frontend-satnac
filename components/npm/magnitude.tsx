"use client";

import { cn } from "@/lib/utils";

const tones = {
  alert: "#be123c",
  steady: "#0f766e",
  ink: "#0f172a",
  inference: "#b45309",
} as const;

export type MagnitudeRow = {
  id: string;
  label: string;
  note?: string;
  value: number;
  tone?: keyof typeof tones;
};

function formatValue(value: number, unit: string, digits: number) {
  return `${value.toFixed(digits)}${unit}`;
}

export function MagnitudeChart({
  title,
  caption,
  max,
  unit = "",
  digits = 0,
  marker,
  rows,
  selectedId,
  onSelect,
}: {
  title: string;
  caption?: string;
  max: number;
  unit?: string;
  digits?: number;
  marker?: { value: number; label: string };
  rows: MagnitudeRow[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const scale = max > 0 ? max : 1;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      {caption ? <p className="mt-1 text-xs leading-5 text-slate-500">{caption}</p> : null}

      <div className="relative mt-4 h-4 text-[10px] tabular-nums text-slate-400">
        <span className="absolute left-0">0</span>
        {marker ? null : (
          <span className="absolute left-1/2 -translate-x-1/2">{formatValue(scale / 2, unit, Number.isInteger(scale / 2) ? 0 : digits)}</span>
        )}
        <span className="absolute right-0">{formatValue(scale, unit, Number.isInteger(scale) ? 0 : digits)}</span>
        {marker ? (
          <span
            className="absolute top-0 -translate-x-1/2 text-slate-700"
            style={{ left: `${Math.min(100, (marker.value / scale) * 100)}%` }}
          >
            {marker.label}
          </span>
        ) : null}
      </div>

      <div className="mt-1 space-y-1">
        {rows.map((row) => {
          const color = tones[row.tone ?? "ink"];
          const width = Math.max(0, Math.min(100, (row.value / scale) * 100));
          const selected = selectedId === row.id;
          const Tag = onSelect ? "button" : "div";
          return (
            <Tag
              key={row.id}
              type={onSelect ? "button" : undefined}
              onClick={onSelect ? () => onSelect(row.id) : undefined}
              className={cn(
                "block w-full rounded-lg px-1 py-1.5 text-left",
                onSelect && "hover:bg-slate-50",
                selected && "bg-slate-50",
              )}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className={cn("block text-sm text-slate-900", selected && "font-semibold")}>{row.label}</span>
                  {row.note ? <span className="block text-[11px] text-slate-500">{row.note}</span> : null}
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums" style={{ color }}>
                  {formatValue(row.value, unit, digits)}
                </span>
              </span>
              <span className="relative mt-1.5 block h-2 rounded-full bg-slate-100">
                <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${width}%`, background: color }} />
                {marker ? (
                  <span
                    className="absolute -top-1 bottom-[-4px] w-px bg-slate-900/40"
                    style={{ left: `${Math.min(100, (marker.value / scale) * 100)}%` }}
                  />
                ) : null}
              </span>
            </Tag>
          );
        })}
      </div>
    </section>
  );
}

export function ProportionBar({
  title,
  caption,
  segments,
}: {
  title: string;
  caption?: string;
  segments: { id: string; label: string; value: number; color: string }[];
}) {
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      {caption ? <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{caption}</p> : null}
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {visible.map((segment) => (
          <div
            key={segment.id}
            style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
            title={`${segment.value} ${segment.label}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {visible.map((segment) => (
          <span key={segment.id} className="inline-flex items-center gap-1.5 text-xs" style={{ color: segment.color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
            <span className="font-semibold tabular-nums">{segment.value}</span>
            <span>{segment.label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
