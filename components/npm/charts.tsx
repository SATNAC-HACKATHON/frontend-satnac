"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxis, formatStamp } from "@/lib/npm/format";
import type { ChartPoint } from "@/lib/types/npm";

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #e6eaef",
  borderRadius: 10,
  fontSize: 12,
  padding: "8px 10px",
};

function formatMark(value: number, suffix: string) {
  const digits = Math.abs(value) >= 100 ? 0 : 1;
  return `${value.toFixed(digits)}${suffix}`;
}

function Tip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <div className="mb-1 font-medium text-slate-900">{label ? formatStamp(String(label)) : ""}</div>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4">
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="font-mono text-slate-900">
            {typeof item.value === "number" ? formatMark(item.value, suffix) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function domainOf(mode: "percent" | "zero" | [number, number], values: number[]): [number, number] | ["auto", "auto"] {
  if (Array.isArray(mode)) return mode;
  if (mode === "percent") return [0, 100];
  const peak = values.reduce((best, value) => Math.max(best, value), 0);
  return [0, peak === 0 ? 1 : peak * 1.18];
}

export function TrendChart({
  points,
  measuredKey,
  baselineKey,
  measuredLabel,
  baselineLabel = "Baseline",
  suffix = "",
  windowStart,
  windowEnd,
  color = "#0f766e",
  height = 220,
  domain = "zero",
  mark = "min",
}: {
  points: ChartPoint[];
  measuredKey: keyof ChartPoint;
  baselineKey?: keyof ChartPoint;
  measuredLabel: string;
  baselineLabel?: string;
  suffix?: string;
  windowStart?: string;
  windowEnd?: string;
  color?: string;
  height?: number;
  domain?: "percent" | "zero" | [number, number];
  mark?: "min" | "max";
}) {
  const data = points.map((point) => {
    const measured = point[measuredKey];
    const baseline = baselineKey ? point[baselineKey] : null;
    return {
      t: point.t,
      measured: typeof measured === "number" ? measured : null,
      baseline: typeof baseline === "number" ? baseline : null,
    };
  });

  let markIndex = -1;
  let markValue = mark === "max" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  const domainValues: number[] = [];
  data.forEach((point, index) => {
    if (typeof point.measured === "number") {
      domainValues.push(point.measured);
      const better = mark === "max" ? point.measured > markValue : point.measured < markValue;
      if (better) {
        markValue = point.measured;
        markIndex = index;
      }
    }
    if (typeof point.baseline === "number") domainValues.push(point.baseline);
  });

  const marked = markIndex >= 0 ? data[markIndex] : null;

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f6" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={formatAxis}
              minTickGap={32}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={domainOf(domain, domainValues)}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(value) => formatMark(Number(value), suffix.trim() === "%" ? "%" : "")}
            />
            {windowStart && windowEnd ? (
              <ReferenceArea x1={windowStart} x2={windowEnd} fill="#be123c" fillOpacity={0.07} />
            ) : null}
            <Tooltip content={<Tip suffix={suffix} />} />
            {baselineKey ? (
              <Line
                dataKey="baseline"
                name={baselineLabel}
                stroke="#94a3b8"
                strokeDasharray="4 3"
                dot={false}
                strokeWidth={1.25}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            <Line
              dataKey="measured"
              name={measuredLabel}
              stroke={color}
              dot={false}
              strokeWidth={1.75}
              connectNulls
              isAnimationActive={false}
            />
            {marked && typeof marked.measured === "number" ? (
              <ReferenceDot
                x={marked.t}
                y={marked.measured}
                r={3.5}
                fill={color}
                stroke="#fff"
                strokeWidth={1.5}
                label={{
                  value: formatMark(marked.measured, suffix),
                  position: "top",
                  fill: color,
                  fontSize: 11,
                }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 pt-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color }}>
          <span className="h-0.5 w-4 rounded-full" style={{ background: color }} />
          {measuredLabel}
        </span>
        {baselineKey ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
            <span className="w-4 border-t border-dashed border-slate-400" />
            {baselineLabel}
          </span>
        ) : null}
        {windowStart && windowEnd ? (
          <span className="inline-flex items-center gap-1.5 text-rose-800">
            <span className="h-2.5 w-3 rounded-sm bg-rose-700/15 ring-1 ring-rose-200" />
            Incident window
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ScoreChart({
  points,
}: {
  points: { t: string; score: number; severity: string }[];
}) {
  const peak = points.reduce<(typeof points)[number] | null>((best, point) => {
    if (!best || point.score > best.score) return point;
    return best;
  }, null);

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f6" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={formatAxis}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<Tip />} />
            <Line
              dataKey="score"
              name="Detection score"
              stroke="#be123c"
              dot={false}
              strokeWidth={1.75}
              isAnimationActive={false}
            />
            {peak ? (
              <ReferenceDot
                x={peak.t}
                y={peak.score}
                r={3.5}
                fill="#be123c"
                stroke="#fff"
                label={{ value: peak.score.toFixed(0), position: "top", fill: "#be123c", fontSize: 11 }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="px-1 pt-2 text-xs font-medium text-rose-800">
        <span className="mr-1.5 inline-block h-0.5 w-4 rounded-full bg-rose-700 align-middle" />
        Detection score · axis 0–100
      </div>
    </div>
  );
}
