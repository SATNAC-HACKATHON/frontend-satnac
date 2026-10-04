import Link from "next/link";
import { TrendChart } from "@/components/npm/charts";
import { DriveMap } from "@/components/npm/drive-map";
import { MagnitudeChart } from "@/components/npm/magnitude";
import { Badge, EpistemicPanel, Metric, PageHeader, Panel } from "@/components/npm/ui";
import { chartPoints, correlatedAlarms, peakDetection } from "@/lib/npm/derive";
import { formatPct, formatWindow } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";
import { lowest, windowPoints } from "@/lib/npm/stories";

export default function OverviewPage() {
  const cluster = snapshot.clusters[0];
  const summary = snapshot.summary;
  const peak = cluster ? peakDetection(cluster.cellId) : null;
  const points = cluster ? chartPoints(cluster.cellId) : [];
  const focus = cluster ? windowPoints(points, cluster.start, cluster.end) : points;
  const accessMin = lowest(focus, "accessibility");
  const throughputMin = lowest(focus, "throughput");
  const stable = snapshot.cells.filter((cell) => cell.status === "stable");
  const healthyFloor = stable.length ? Math.min(...stable.map((cell) => cell.minAccessibility)) : null;
  const degraded = snapshot.cells.find((cell) => cell.status === "degraded");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title={degraded ? degraded.cellId : "No degraded cell"}
        description={degraded ? `${degraded.city} · ${snapshot.clusters.length} incident from ${snapshot.alarms.length} alarms` : ""}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Incidents" value={String(snapshot.clusters.length)} />
        <Metric label="Cells watched" value={String(snapshot.cells.length)} detail={`${stable.length} stable`} />
        <Metric label="Duplicate alarms" value={String(correlatedAlarms().length)} />
        <Metric label="Time saved" value={`${summary.savedMinutes} min`} />
      </div>

      {cluster ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={peak?.severity ?? summary.severity} />
                <span className="font-mono text-xs text-slate-500">{cluster.clusterId}</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{cluster.predictedRootCause}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {cluster.cellId} · {cluster.siteId} · {formatWindow(cluster.start, cluster.end)}
              </p>
            </div>
            <Link href={`/incidents/${cluster.clusterId}`} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
              Investigate
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <EpistemicPanel kind="fact" title="What was recorded" source="engineer_report.md">
              {snapshot.engineerReport.facts[2] ?? snapshot.engineerReport.facts[0]}
            </EpistemicPanel>
            <EpistemicPanel kind="inference" title="What the model concludes" source="rca_report.json">
              {cluster.predictedRootCause}, confidence {formatPct(cluster.confidence * 100, 0)}.
            </EpistemicPanel>
            <EpistemicPanel kind="recommendation" title="What to do next" source="engineer_report.md">
              {snapshot.engineerReport.recommendation[0]}
            </EpistemicPanel>
          </div>
        </section>
      ) : null}

      {cluster ? (
        <DriveMap samples={snapshot.geoSamples} initialSiteId={cluster.siteId} title="Drive tests" />
      ) : null}

      {cluster ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">
              Accessibility {accessMin == null ? "" : `${accessMin.toFixed(1)}%`}
            </h2>
            <div className="mt-2">
              <TrendChart
                points={points}
                measuredKey="accessibility"
                baselineKey="baselineAccessibility"
                measuredLabel="Accessibility"
                suffix="%"
                domain={[70, 100]}
                mark="min"
                windowStart={cluster.start}
                windowEnd={cluster.end}
                height={220}
              />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">
              Downlink {throughputMin == null ? "" : `${throughputMin.toFixed(1)} Mbps`}
            </h2>
            <div className="mt-2">
              <TrendChart
                points={points}
                measuredKey="throughput"
                baselineKey="baselineThroughput"
                measuredLabel="Downlink"
                baselineLabel="Baseline"
                suffix=" Mbps"
                domain="zero"
                mark="min"
                windowStart={cluster.start}
                windowEnd={cluster.end}
                color="#0f172a"
                height={220}
              />
            </div>
          </section>
        </div>
      ) : null}

      <MagnitudeChart
        title={degraded ? `Only ${degraded.cellId} fell away from the rest of the estate` : "Lowest accessibility by cell"}
        caption={healthyFloor == null ? undefined : `Mark at ${healthyFloor.toFixed(1)}%, the weakest stable cell.`}
        max={100}
        unit="%"
        digits={1}
        marker={healthyFloor == null ? undefined : { value: healthyFloor, label: `${healthyFloor.toFixed(0)}%` }}
        rows={[...snapshot.cells]
          .sort((a, b) => a.minAccessibility - b.minAccessibility)
          .map((cell) => ({
            id: cell.cellId,
            label: cell.cellId,
            note: `${cell.city} · ${cell.band}`,
            value: cell.minAccessibility,
            tone: cell.status === "degraded" ? "alert" : "steady",
          }))}
      />

      <Panel title="Cells">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Cell</th>
                <th className="px-4 py-2 font-medium">Place</th>
                <th className="px-4 py-2 font-medium">Band</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Lowest accessibility</th>
                <th className="px-4 py-2 font-medium">Lowest throughput</th>
                <th className="px-4 py-2 font-medium">Peak anomaly</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.cells.map((cell) => (
                <tr key={cell.cellId} className={cell.status === "degraded" ? "border-t border-rose-100 bg-rose-50/70" : "border-t border-slate-100"}>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-900">{cell.cellId}</td>
                  <td className="px-4 py-2.5 text-slate-600">{cell.city}</td>
                  <td className="px-4 py-2.5 text-slate-600">{cell.band}</td>
                  <td className="px-4 py-2.5"><Badge value={cell.status} /></td>
                  <td className="px-4 py-2.5 font-mono text-xs">{cell.minAccessibility.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{cell.minThroughput.toFixed(1)} Mbps</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{cell.maxAnomaly.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
