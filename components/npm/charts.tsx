"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { formatAxis, formatStamp } from "@/lib/npm/format";
import type { ChartPoint, DriveTest } from "@/lib/types/npm";

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  padding: "8px 10px",
};

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <div className="mb-1 font-medium text-slate-900">{label ? formatStamp(label) : ""}</div>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4 text-slate-600">
          <span>{item.name}</span>
          <span className="font-mono text-slate-900">{typeof item.value === "number" ? item.value.toFixed(2) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({
  points,
  measuredKey,
  baselineKey,
  measuredLabel,
  baselineLabel,
  unit,
  windowStart,
  windowEnd,
  color = "#0f766e",
  height = 220,
}: {
  points: ChartPoint[];
  measuredKey: keyof ChartPoint;
  baselineKey?: keyof ChartPoint;
  measuredLabel: string;
  baselineLabel?: string;
  unit: string;
  windowStart?: string;
  windowEnd?: string;
  color?: string;
  height?: number;
}) {
  const data = points.map((point) => ({
    t: point.t,
    measured: point[measuredKey],
    baseline: baselineKey ? point[baselineKey] : null,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="t" tickFormatter={formatAxis} minTickGap={32} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={42} unit={unit === "%" ? "%" : undefined} />
          {windowStart && windowEnd ? (
            <ReferenceArea x1={windowStart} x2={windowEnd} fill="#be123c" fillOpacity={0.06} />
          ) : null}
          <Tooltip content={<Tip />} />
          {baselineKey ? (
            <Line dataKey="baseline" name={baselineLabel} stroke="#94a3b8" strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
          ) : null}
          <Area dataKey="measured" name={measuredLabel} stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreChart({
  points,
}: {
  points: { t: string; score: number; severity: string }[];
}) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="t" tickFormatter={formatAxis} minTickGap={24} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<Tip />} />
          <Area dataKey="score" name="Detection score" stroke="#be123c" fill="#be123c" fillOpacity={0.1} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DriveScatter({ tests }: { tests: DriveTest[] }) {
  const failed = tests.filter((test) => test.result !== "pass");
  const passed = tests.filter((test) => test.result === "pass");
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f6" />
          <XAxis dataKey="lng" name="Longitude" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
          <YAxis dataKey="lat" name="Latitude" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={68} domain={["auto", "auto"]} />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) => [typeof value === "number" ? value.toFixed(5) : value, name]}
          />
          <Scatter name="Pass" data={passed} fill="#0f766e" />
          <Scatter name="Fail" data={failed} fill="#be123c" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
