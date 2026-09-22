"use client";

import { useMemo, useState } from "react";
import { TrendChart } from "@/components/npm/charts";
import { Badge, Panel } from "@/components/npm/ui";
import { chartPoints } from "@/lib/npm/derive";
import { formatStamp } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";

export function SignalExplorer() {
  const cells = snapshot.cells;
  const detections = snapshot.detections;
  const cluster = snapshot.clusters[0];
  const degraded = cells.find((cell) => cell.status === "degraded")?.cellId ?? cells[0]?.cellId ?? "";
  const [cellId, setCellId] = useState(degraded);
  const cell = cells.find((item) => item.cellId === cellId);
  const points = useMemo(() => chartPoints(cellId), [cellId]);
  const cellDetections = useMemo(
    () => detections.filter((row) => row.cellId === cellId),
    [detections, cellId],
  );
  const clusterWindow = cluster && cluster.cellId === cellId ? { start: cluster.start, end: cluster.end } : undefined;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cells.map((item) => (
          <button
            key={item.cellId}
            onClick={() => setCellId(item.cellId)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-left ${
              item.cellId === cellId ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span className="block font-mono text-xs">{item.cellId}</span>
            <span className={`block text-[10px] ${item.cellId === cellId ? "text-slate-300" : "text-slate-400"}`}>{item.city}</span>
          </button>
        ))}
      </div>

      {cell ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge value={cell.status} />
          <p className="text-sm text-slate-600">
            {cell.band} · {cell.region} · worst anomaly {cell.maxAnomaly.toFixed(2)} · lowest accessibility {cell.minAccessibility.toFixed(1)}%
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Accessibility against baseline" className="p-3">
          <TrendChart
            points={points}
            measuredKey="accessibility"
            baselineKey="baselineAccessibility"
            measuredLabel="Accessibility"
            baselineLabel="Baseline"
            unit="%"
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
          />
        </Panel>
        <Panel title="Downlink throughput against baseline" className="p-3">
          <TrendChart
            points={points}
            measuredKey="throughput"
            baselineKey="baselineThroughput"
            measuredLabel="Throughput Mbps"
            baselineLabel="Baseline Mbps"
            unit=""
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
            color="#0f172a"
          />
        </Panel>
        <Panel title="Latency" className="p-3">
          <TrendChart points={points} measuredKey="latency" measuredLabel="Latency ms" unit="" windowStart={clusterWindow?.start} windowEnd={clusterWindow?.end} color="#1d4ed8" />
        </Panel>
        <Panel title="PRB utilisation" className="p-3">
          <TrendChart points={points} measuredKey="prb" measuredLabel="PRB %" unit="%" windowStart={clusterWindow?.start} windowEnd={clusterWindow?.end} color="#7c3aed" />
        </Panel>
        <Panel title="Packet loss" className="p-3">
          <TrendChart points={points} measuredKey="packetLoss" measuredLabel="Packet loss %" unit="%" windowStart={clusterWindow?.start} windowEnd={clusterWindow?.end} color="#b45309" />
        </Panel>
        <Panel title="Anomaly score" className="p-3">
          <TrendChart points={points} measuredKey="anomaly" measuredLabel="Anomaly score" unit="" windowStart={clusterWindow?.start} windowEnd={clusterWindow?.end} color="#be123c" />
        </Panel>
      </div>

      <Panel title="Detected windows" aside={<span className="text-xs text-slate-400">{cellDetections.length} rows</span>}>
        {cellDetections.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No deteriorating window was scored for this cell. It stays off the incident queue.</p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Severity</th>
                  <th className="px-4 py-2 font-medium">Accessibility</th>
                  <th className="px-4 py-2 font-medium">Throughput</th>
                  <th className="px-4 py-2 font-medium">Packet loss</th>
                </tr>
              </thead>
              <tbody>
                {cellDetections.map((row) => (
                  <tr key={row.t} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.t)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.score.toFixed(1)}</td>
                    <td className="px-4 py-2"><Badge value={row.severity} /></td>
                    <td className="px-4 py-2 font-mono text-xs">{row.accessibility.toFixed(1)}%</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.throughput.toFixed(1)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.packetLoss.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
