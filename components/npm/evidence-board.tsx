"use client";

import { useState } from "react";
import { DriveMap } from "@/components/npm/drive-map";
import { Badge, Panel } from "@/components/npm/ui";
import { formatStamp } from "@/lib/npm/format";
import { cn } from "@/lib/utils";
import type { Alarm, Complaint, Detection, DriveTest, TopologyEvent } from "@/lib/types/npm";

const sources = ["KPI windows", "Alarms", "Complaints", "Drive tests", "Topology"] as const;

export function EvidenceBoard({
  detections,
  alarms,
  complaints,
  driveTests,
  topology,
  counts,
}: {
  detections: Detection[];
  alarms: Alarm[];
  complaints: Complaint[];
  driveTests: DriveTest[];
  topology: TopologyEvent[];
  counts: { id: (typeof sources)[number]; dataset: number; inCluster: number; note: string }[];
}) {
  const [source, setSource] = useState<(typeof sources)[number]>("KPI windows");
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null);
  const active = counts.find((item) => item.id === source);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {counts.map((item) => (
          <button
            key={item.id}
            onClick={() => setSource(item.id)}
            className={`rounded-xl border px-3 py-3 text-left ${source === item.id ? "border-slate-900 bg-white" : "border-slate-200 bg-white/70"}`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.id}</div>
            <div className="mt-2 font-mono text-xl text-slate-950">{item.inCluster}</div>
            <div className="mt-1 text-xs text-slate-500">{item.dataset.toLocaleString("en-ZA")} in the dataset</div>
          </button>
        ))}
      </div>

      <Panel title={source} aside={<span className="max-w-sm text-right text-xs text-slate-400">{active?.note}</span>}>
        {source === "Drive tests" ? (
          <div className="border-b border-slate-100">
            <DriveMap
              samples={driveTests}
              initialSiteId={driveTests[0]?.siteId}
              selectedId={selectedDrive}
              onSelect={setSelectedDrive}
              framed={false}
              title="Drive tests"
            />
          </div>
        ) : null}
        <div className="max-h-[560px] overflow-auto">
          {source === "KPI windows" ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Cell</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Accessibility</th>
                  <th className="px-4 py-2 font-medium">Throughput</th>
                  <th className="px-4 py-2 font-medium">Discards</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((row) => (
                  <tr key={`${row.cellId}-${row.t}`} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.t)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.cellId}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.score.toFixed(1)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.accessibility.toFixed(1)} / {row.baselineAccessibility.toFixed(1)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.throughput.toFixed(1)} / {row.baselineThroughput.toFixed(1)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.discards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {source === "Alarms" ? (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Raised</th>
                  <th className="px-4 py-2 font-medium">Severity</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Domain</th>
                </tr>
              </thead>
              <tbody>
                {alarms.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.raised)}</td>
                    <td className="px-4 py-2"><Badge value={row.severity} /></td>
                    <td className="px-4 py-2">
                      <div className="text-slate-900">{row.description}</div>
                      <div className="font-mono text-[11px] text-slate-400">{row.id}</div>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{row.domain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {source === "Complaints" ? (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Opened</th>
                  <th className="px-4 py-2 font-medium">Class</th>
                  <th className="px-4 py-2 font-medium">Impact</th>
                  <th className="px-4 py-2 font-medium">Area</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.opened)}</td>
                    <td className="px-4 py-2 text-slate-900">{row.classification}</td>
                    <td className="px-4 py-2 text-slate-600">{row.impact.replaceAll("_", " ")}</td>
                    <td className="px-4 py-2 text-slate-600">{row.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {source === "Drive tests" ? (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Cell</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium">Download</th>
                  <th className="px-4 py-2 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {driveTests.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setSelectedDrive(row.id);
                      setSource("Drive tests");
                    }}
                    className={cn("cursor-pointer border-t border-slate-100", selectedDrive === row.id ? "bg-slate-100" : "hover:bg-slate-50")}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.t)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.cellId}</td>
                    <td className="px-4 py-2"><Badge value={row.result} /></td>
                    <td className="px-4 py-2 font-mono text-xs">{row.download.toFixed(1)} Mbps</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.latency.toFixed(0)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {source === "Topology" ? (
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">In cluster</th>
                  <th className="px-4 py-2 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody>
                {topology.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.t)}</td>
                    <td className="px-4 py-2 text-slate-900">{row.eventType.replaceAll("_", " ")}</td>
                    <td className="px-4 py-2 text-slate-600">{row.clusters[0] ?? "No"}</td>
                    <td className="px-4 py-2 text-slate-600">{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
