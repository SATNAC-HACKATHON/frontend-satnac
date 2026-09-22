import Link from "next/link";
import { ScoreChart, TrendChart } from "@/components/npm/charts";
import { Badge, EpistemicPanel, Metric, PageHeader, Panel, ReadingKey } from "@/components/npm/ui";
import { artifactGaps, backgroundAlarms, chartPoints, correlatedAlarms, peakDetection, siblingsOf } from "@/lib/npm/derive";
import { formatNumber, formatPct, formatWindow } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";

export default function OverviewPage() {
  const cluster = snapshot.clusters[0];
  const summary = snapshot.summary;
  const peak = cluster ? peakDetection(cluster.cellId) : null;
  const siblings = cluster ? siblingsOf(cluster.cellId) : [];
  const stableSiblings = siblings.filter((cell) => cell.status === "stable").length;
  const points = cluster ? chartPoints(cluster.cellId) : [];
  const gaps = cluster ? artifactGaps(cluster) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Situation"
        title="One significant issue out of the noise"
        description="Twelve cells were watched. Forty alarms were raised. The model promotes a single cell-degradation incident and leaves the rest as background."
        action={<ReadingKey />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Significant incidents" value={String(snapshot.clusters.length)} detail="Ranked above raw alarms" />
        <Metric label="Cells watched" value={String(snapshot.cells.length)} detail={`${snapshot.cells.filter((cell) => cell.status === "stable").length} stayed stable`} />
        <Metric label="Alarms collapsed" value={formatPct(summary.duplicateSuppressedPct, 1)} detail={`${correlatedAlarms().length} symptoms share one duplicate group`} />
        <Metric label="Investigation estimate" value={`${summary.assistedMinutes} min`} detail={`${summary.manualMinutes} min manual baseline · ${summary.savedMinutes} min apart`} />
      </div>

      {cluster ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={peak?.severity ?? summary.severity} />
                <span className="font-mono text-xs text-slate-500">{cluster.clusterId}</span>
                <span className="font-mono text-xs text-slate-400">{summary.incidentId}</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{cluster.cellId}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {cluster.siteId} · {formatWindow(cluster.start, cluster.end)} · {cluster.rawEventCount} grouped events
              </p>
            </div>
            <Link href={`/incidents/${cluster.clusterId}`} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
              Investigate
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <EpistemicPanel kind="fact" title="Observed" source="engineer_report.md">
              {snapshot.engineerReport.facts[0]}
            </EpistemicPanel>
            <EpistemicPanel kind="inference" title="Inferred cause" source="rca_report.json">
              {cluster.predictedRootCause}, confidence {formatPct(cluster.confidence * 100, 0)}.
            </EpistemicPanel>
            <EpistemicPanel kind="recommendation" title="Next step" source="engineer_report.md">
              {snapshot.engineerReport.recommendation[0]}
            </EpistemicPanel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="px-1 text-sm font-semibold text-slate-900">Accessibility, with the cluster window shaded</h3>
              <TrendChart
                points={points}
                measuredKey="accessibility"
                baselineKey="baselineAccessibility"
                measuredLabel="Accessibility"
                baselineLabel="Baseline"
                unit="%"
                windowStart={cluster.start}
                windowEnd={cluster.end}
              />
            </div>
            <div>
              <h3 className="px-1 text-sm font-semibold text-slate-900">Detection score on the degraded cell</h3>
              <ScoreChart
                points={snapshot.detections
                  .filter((row) => row.cellId === cluster.cellId)
                  .map((row) => ({ t: row.t, score: row.score, severity: row.severity }))}
              />
            </div>
          </div>
        </section>
      ) : null}

      <Panel title="Cell estate" aside={<span className="text-xs text-slate-400">Worst sample in the two-day window</span>}>
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
                <tr key={cell.cellId} className="border-t border-slate-100">
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Sibling sectors stable" value={`${stableSiblings}/${siblings.length || 0}`} detail="Same site, no degradation label" />
        <Metric label="Background alarms" value={formatNumber(backgroundAlarms().length)} detail="Left outside the incident cluster" />
        <Metric label="Output disagreements" value={String(gaps.length)} detail="Summary file versus pipeline cluster" />
      </div>
    </div>
  );
}
