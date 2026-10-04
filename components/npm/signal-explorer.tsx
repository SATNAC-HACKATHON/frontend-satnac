"use client";

import { useMemo, useState } from "react";
import { CellMultiples } from "@/components/npm/cell-multiples";
import { TrendChart } from "@/components/npm/charts";
import { Badge, Panel } from "@/components/npm/ui";
import { chartPoints } from "@/lib/npm/derive";
import { formatStamp } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";
import { highest, lowest, windowPoints } from "@/lib/npm/stories";

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
  const focus = windowPoints(points, clusterWindow?.start, clusterWindow?.end);
  const accessMin = lowest(focus, "accessibility");
  const throughputMin = lowest(focus, "throughput");
  const latencyMax = highest(focus, "latency");
  const prbMax = highest(focus, "prb");
  const lossMax = highest(focus, "packetLoss");
  const anomalyMax = highest(focus, "anomaly");

  return (
    <div className="space-y-5">
      <CellMultiples activeId={cellId} onSelect={setCellId} />

      {cell ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge value={cell.status} />
          <p className="text-sm text-slate-600">
            {cell.cellId} · {cell.band} · {cell.region}
            {clusterWindow ? " · shaded band is the incident window" : " · no incident window on this cell"}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Lowest accessibility sample was {accessMin == null ? "—" : `${accessMin.toFixed(1)}%`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Scale is 70–100%. Dashed line is this cell’s rolling baseline.</p>
          <TrendChart
            points={points}
            measuredKey="accessibility"
            baselineKey="baselineAccessibility"
            measuredLabel="Accessibility"
            suffix="%"
            domain={[70, 100]}
            mark="min"
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
          />
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Lowest downlink sample was {throughputMin == null ? "—" : `${throughputMin.toFixed(1)} Mbps`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Axis starts at zero so the drop can be compared with the baseline.</p>
          <TrendChart
            points={points}
            measuredKey="throughput"
            baselineKey="baselineThroughput"
            measuredLabel="Downlink"
            suffix=" Mbps"
            domain="zero"
            mark="min"
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
            color="#0f172a"
          />
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Latency peaked at {latencyMax == null ? "—" : `${latencyMax.toFixed(0)} ms`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Axis starts at zero.</p>
          <TrendChart
            points={points}
            measuredKey="latency"
            measuredLabel="Latency"
            suffix=" ms"
            domain="zero"
            mark="max"
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
            color="#334155"
          />
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            PRB utilisation peaked at {prbMax == null ? "—" : `${prbMax.toFixed(0)}%`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Axis 0–100%. A high PRB is shown as measured, not treated as the cause.</p>
          <TrendChart
            points={points}
            measuredKey="prb"
            measuredLabel="PRB"
            suffix="%"
            domain="percent"
            mark="max"
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
            color="#334155"
          />
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Packet loss peaked at {lossMax == null ? "—" : `${lossMax.toFixed(1)}%`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Axis starts at zero.
            {lossMax != null && lossMax > 2 ? " This cell crossed the 2% level the report uses as transport evidence." : ""}
          </p>
          <TrendChart
            points={points}
            measuredKey="packetLoss"
            measuredLabel="Packet loss"
            suffix="%"
            domain="zero"
            mark="max"
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
            color="#be123c"
          />
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Anomaly score peaked at {anomalyMax == null ? "—" : anomalyMax.toFixed(2)}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Model score, kept apart from the measured KPIs above. Axis starts at zero.</p>
          <TrendChart
            points={points}
            measuredKey="anomaly"
            measuredLabel="Anomaly score"
            domain={[0, 1]}
            mark="max"
            windowStart={clusterWindow?.start}
            windowEnd={clusterWindow?.end}
            color="#be123c"
          />
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
