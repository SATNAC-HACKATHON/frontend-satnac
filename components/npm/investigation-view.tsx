"use client";

import { useState } from "react";
import { Badge, EpistemicPanel, Panel } from "@/components/npm/ui";
import { TrendChart } from "@/components/npm/charts";
import { formatPct, formatStamp } from "@/lib/npm/format";
import type {
  Alarm,
  ChartPoint,
  Complaint,
  DriveTest,
  EngineerReport,
  PipelineCluster,
  ScenarioSummary,
  TimelineItem,
  TopologyEvent,
} from "@/lib/types/npm";

const tabs = ["Alarms", "Complaints", "Drive tests", "Topology"] as const;

export function InvestigationView({
  cluster,
  summary,
  report,
  timeline,
  series,
  alarms,
  complaints,
  driveTests,
  topology,
}: {
  cluster: PipelineCluster;
  summary: ScenarioSummary;
  report: EngineerReport;
  timeline: TimelineItem[];
  series: ChartPoint[];
  alarms: Alarm[];
  complaints: Complaint[];
  driveTests: DriveTest[];
  topology: TopologyEvent[];
}) {
  const [causeIndex, setCauseIndex] = useState(0);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Alarms");
  const cause = cluster.rankedCandidates[causeIndex];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <EpistemicPanel kind="fact" title="What was recorded" source="engineer_report.md">
          <ul className="space-y-2">
            {report.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </EpistemicPanel>
        <EpistemicPanel kind="inference" title="What the model concludes" source="engineer_report.md">
          <ul className="space-y-2">
            {report.inference.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </EpistemicPanel>
        <EpistemicPanel kind="recommendation" title="What to do next" source="engineer_report.md">
          <ul className="space-y-2">
            {report.recommendation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            This is a suggestion for the engineer. The desk does not change the network.
          </p>
        </EpistemicPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title="Ranked causes" aside={<span className="font-mono text-[10px] text-slate-400">rca_report.json</span>}>
          <ul className="p-2">
            {cluster.rankedCandidates.map((candidate, index) => (
              <li key={candidate.rootCause}>
                <button
                  onClick={() => setCauseIndex(index)}
                  className={`w-full rounded-lg px-3 py-2 text-left ${index === causeIndex ? "bg-slate-100" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-900">{candidate.rootCause}</span>
                    <span className="font-mono text-xs text-slate-500">{candidate.score.toFixed(0)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.min(candidate.score, 100)}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <EpistemicPanel kind="inference" title={cause?.rootCause ?? "Cause"} source={`${cluster.clusterId} · score ${cause?.score.toFixed(0) ?? "—"}`}>
          <ul className="space-y-2">
            {cause?.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Confidence on this cluster is {formatPct(cluster.confidence * 100, 0)}. The scenario summary file reports {formatPct(summary.confidence * 100, 0)} for the same story.
          </p>
        </EpistemicPanel>
      </div>

      <Panel title="How the incident assembled" aside={<span className="text-xs text-slate-400">Facts in order, inferences marked</span>}>
        <ol className="divide-y divide-slate-100">
          {timeline.map((item) => (
            <li key={`${item.t}-${item.title}`} className="grid gap-2 px-4 py-3 sm:grid-cols-[148px_1fr]">
              <div>
                <div className="font-mono text-xs text-slate-500">{formatStamp(item.t)}</div>
                <div className="mt-1">
                  <Badge value={item.kind} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{item.title}</div>
                <p className={`mt-1 text-sm leading-6 ${item.caution ? "text-amber-900" : "text-slate-600"}`}>{item.detail}</p>
                <p className="mt-1 font-mono text-[10px] text-slate-400">{item.source}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Accessibility" className="p-3">
          <TrendChart
            points={series}
            measuredKey="accessibility"
            baselineKey="baselineAccessibility"
            measuredLabel="Accessibility"
            baselineLabel="Baseline"
            unit="%"
            windowStart={cluster.start}
            windowEnd={cluster.end}
            height={180}
          />
        </Panel>
        <Panel title="Downlink throughput" className="p-3">
          <TrendChart
            points={series}
            measuredKey="throughput"
            baselineKey="baselineThroughput"
            measuredLabel="Throughput Mbps"
            baselineLabel="Baseline Mbps"
            unit=""
            windowStart={cluster.start}
            windowEnd={cluster.end}
            height={180}
            color="#0f172a"
          />
        </Panel>
        <Panel title="Packet loss" className="p-3">
          <TrendChart
            points={series}
            measuredKey="packetLoss"
            measuredLabel="Packet loss %"
            unit="%"
            windowStart={cluster.start}
            windowEnd={cluster.end}
            height={180}
            color="#b45309"
          />
        </Panel>
      </div>

      <Panel
        title="Supporting records"
        aside={
          <div className="flex gap-1">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${tab === item ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      >
        <div className="max-h-[420px] overflow-auto">
          {tab === "Alarms" ? <AlarmTable rows={alarms} /> : null}
          {tab === "Complaints" ? <ComplaintTable rows={complaints} /> : null}
          {tab === "Drive tests" ? <DriveTable rows={driveTests} /> : null}
          {tab === "Topology" ? <TopologyTable rows={topology} /> : null}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <EpistemicPanel kind="fact" title="Scenario summary facts" source="incident_summary.csv">
          {summary.observedFacts}
        </EpistemicPanel>
        <EpistemicPanel kind="inference" title="Scenario summary inference" source="incident_summary.csv">
          {summary.aiInference}
        </EpistemicPanel>
        <EpistemicPanel kind="recommendation" title="Scenario summary action" source="incident_summary.csv">
          {summary.recommendation}
        </EpistemicPanel>
      </div>
    </div>
  );
}

function AlarmTable({ rows }: { rows: Alarm[] }) {
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-4 py-2 font-medium">Raised</th>
          <th className="px-4 py-2 font-medium">Severity</th>
          <th className="px-4 py-2 font-medium">Alarm</th>
          <th className="px-4 py-2 font-medium">Tagged</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.raised)}</td>
            <td className="px-4 py-2"><Badge value={row.severity} /></td>
            <td className="px-4 py-2">
              <div className="font-medium text-slate-900">{row.description}</div>
              <div className="font-mono text-[11px] text-slate-400">{row.id} · {row.code}</div>
            </td>
            <td className="px-4 py-2 text-slate-600">{row.incidentId || "Window only"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ComplaintTable({ rows }: { rows: Complaint[] }) {
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-4 py-2 font-medium">Opened</th>
          <th className="px-4 py-2 font-medium">Class</th>
          <th className="px-4 py-2 font-medium">Impact</th>
          <th className="px-4 py-2 font-medium">Priority</th>
          <th className="px-4 py-2 font-medium">Sentiment</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.opened)}</td>
            <td className="px-4 py-2 text-slate-900">{row.classification}</td>
            <td className="px-4 py-2 text-slate-600">{row.impact.replaceAll("_", " ")}</td>
            <td className="px-4 py-2"><Badge value={row.priority} /></td>
            <td className="px-4 py-2 font-mono text-xs">{row.sentiment.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DriveTable({ rows }: { rows: DriveTest[] }) {
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-4 py-2 font-medium">Time</th>
          <th className="px-4 py-2 font-medium">Result</th>
          <th className="px-4 py-2 font-medium">Download</th>
          <th className="px-4 py-2 font-medium">RSRP</th>
          <th className="px-4 py-2 font-medium">SINR</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.t)}</td>
            <td className="px-4 py-2"><Badge value={row.result} /></td>
            <td className="px-4 py-2 font-mono text-xs">{row.download.toFixed(1)} Mbps</td>
            <td className="px-4 py-2 font-mono text-xs">{row.rsrp.toFixed(1)}</td>
            <td className="px-4 py-2 font-mono text-xs">{row.sinr.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TopologyTable({ rows }: { rows: TopologyEvent[] }) {
  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-4 py-2 font-medium">Time</th>
          <th className="px-4 py-2 font-medium">Event</th>
          <th className="px-4 py-2 font-medium">Summary</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-100 align-top">
            <td className="px-4 py-2 font-mono text-xs text-slate-500">{formatStamp(row.t)}</td>
            <td className="px-4 py-2">
              <div className="font-medium text-slate-900">{row.eventType.replaceAll("_", " ")}</div>
              <div className="font-mono text-[11px] text-slate-400">{row.id}</div>
            </td>
            <td className="px-4 py-2 text-slate-600">{row.summary}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
