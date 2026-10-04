"use client";

import { useState } from "react";
import { TrendChart } from "@/components/npm/charts";
import { DriveMap } from "@/components/npm/drive-map";
import { MagnitudeChart } from "@/components/npm/magnitude";
import { Badge, EpistemicPanel, Panel } from "@/components/npm/ui";
import { formatPct, formatStamp } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";
import { highest, lowest, windowPoints } from "@/lib/npm/stories";
import { cn } from "@/lib/utils";
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
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null);
  const cause = cluster.rankedCandidates[causeIndex];
  const focus = windowPoints(series, cluster.start, cluster.end);
  const accessMin = lowest(focus, "accessibility");
  const throughputMin = lowest(focus, "throughput");
  const lossMax = highest(focus, "packetLoss");
  const city = snapshot.cells.find((cell) => cell.cellId === cluster.cellId)?.city ?? "";
  const failedDrives = driveTests.filter((row) => row.result !== "pass").length;

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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <MagnitudeChart
          title="Ranked causes, on one scale"
          caption="Scores from rca_report.json. Bars start at zero and share 0–100. Select a cause to read its evidence."
          max={100}
          selectedId={cause?.rootCause}
          onSelect={(id) => setCauseIndex(Math.max(0, cluster.rankedCandidates.findIndex((candidate) => candidate.rootCause === id)))}
          rows={cluster.rankedCandidates.map((candidate, index) => ({
            id: candidate.rootCause,
            label: candidate.rootCause,
            value: candidate.score,
            tone: index === causeIndex ? "inference" : "ink",
          }))}
        />
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
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Lowest accessibility sample was {accessMin == null ? "—" : `${accessMin.toFixed(1)}%`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Scale is 70–100%. Dashed line is the rolling baseline.</p>
          <TrendChart
            points={series}
            measuredKey="accessibility"
            baselineKey="baselineAccessibility"
            measuredLabel="Accessibility"
            suffix="%"
            domain={[70, 100]}
            mark="min"
            windowStart={cluster.start}
            windowEnd={cluster.end}
            height={180}
          />
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Lowest downlink sample was {throughputMin == null ? "—" : `${throughputMin.toFixed(1)} Mbps`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Axis starts at zero.</p>
          <TrendChart
            points={series}
            measuredKey="throughput"
            baselineKey="baselineThroughput"
            measuredLabel="Downlink"
            suffix=" Mbps"
            domain="zero"
            mark="min"
            windowStart={cluster.start}
            windowEnd={cluster.end}
            height={180}
            color="#0f172a"
          />
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Packet loss peaked at {lossMax == null ? "—" : `${lossMax.toFixed(1)}%`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Axis starts at zero. Loss above 2% is cited as transport evidence.</p>
          <TrendChart
            points={series}
            measuredKey="packetLoss"
            measuredLabel="Packet loss"
            suffix="%"
            domain="zero"
            mark="max"
            windowStart={cluster.start}
            windowEnd={cluster.end}
            height={180}
            color="#be123c"
          />
        </Panel>
      </div>

      <DriveMap
        samples={driveTests}
        initialSiteId={cluster.siteId}
        selectedId={selectedDrive}
        onSelect={(id) => {
          setSelectedDrive(id);
          if (id) setTab("Drive tests");
        }}
        title={`${failedDrives} failed drive tests${city ? ` in ${city}` : ""}`}
        caption="Red failed and green passed, on the coordinates from the drive-test log. Select a sample to centre it. The street names replace reading latitude and longitude."
      />

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
          {tab === "Drive tests" ? <DriveTable rows={driveTests} selectedId={selectedDrive} onSelect={setSelectedDrive} /> : null}
          {tab === "Topology" ? <TopologyTable rows={topology} /> : null}
        </div>
      </Panel>

      <div>
        <h2 className="text-sm font-semibold text-slate-950">Scenario summary, in its own words</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          This file tells the same story as the engineer report. Where a number differs, the table at the top of the page keeps both.
        </p>
      </div>
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

function DriveTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: DriveTest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
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
          <tr
            key={row.id}
            onClick={() => onSelect(row.id)}
            className={cn("cursor-pointer border-t border-slate-100", selectedId === row.id ? "bg-slate-100" : "hover:bg-slate-50")}
          >
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
