import Link from "next/link";
import { MagnitudeChart } from "@/components/npm/magnitude";
import { Badge, Metric, PageHeader, Panel } from "@/components/npm/ui";
import { backgroundAlarms, incidentQueue } from "@/lib/npm/derive";
import { formatPct, formatWindow } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";

export default function IncidentsPage() {
  const queue = incidentQueue();
  const stable = snapshot.cells.filter((cell) => cell.status === "stable");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Prioritisation"
        title={queue.length === 1 ? "Open this incident first" : "Significant issues, in the order to open them"}
        description="Priority follows detection score. Stable cells and background alarms stay off this queue."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Opened as incidents" value={String(queue.length)} detail="Clusters the pipeline promoted" />
        <Metric label="Cells not promoted" value={String(stable.length)} detail="No degradation label in the window" />
        <Metric label="Alarms not promoted" value={String(backgroundAlarms().length)} detail="Noise left outside every cluster" />
      </div>

      <div className="space-y-3">
        {queue.map((item, index) => (
          <Link
            key={item.cluster.clusterId}
            href={`/incidents/${item.cluster.clusterId}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">#{index + 1}</span>
                  <Badge value={item.severity} />
                  <span className="font-mono text-xs text-slate-500">{item.cluster.clusterId}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{item.cluster.cellId}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {item.city}, {item.region} · {item.band} · {formatWindow(item.cluster.start, item.cluster.end)}
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-semibold text-slate-950">{item.peakScore.toFixed(0)}</div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Peak detection</div>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Inference</dt>
                <dd className="mt-1 text-slate-800">{item.cluster.predictedRootCause}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Confidence</dt>
                <dd className="mt-1 font-mono text-slate-800">{formatPct(item.cluster.confidence * 100, 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Grouped events</dt>
                <dd className="mt-1 font-mono text-slate-800">{item.cluster.rawEventCount}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Complaints in cluster</dt>
                <dd className="mt-1 font-mono text-slate-800">{item.cluster.complaintCount}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>

      <MagnitudeChart
        title="Why the queue has one name on it"
        caption="Lowest accessibility sample. The degraded cell is the only one promoted."
        max={100}
        unit="%"
        digits={1}
        rows={[...snapshot.cells]
          .sort((a, b) => a.minAccessibility - b.minAccessibility)
          .map((cell) => ({
            id: cell.cellId,
            label: cell.cellId,
            note: cell.city,
            value: cell.minAccessibility,
            tone: cell.status === "degraded" ? "alert" : "steady",
          }))}
      />

      <Panel title="Watched, not opened">
        <p className="px-4 pt-3 text-sm text-slate-600">
          These cells produced samples across the same two days and were not labeled as degraded. They are the contrast
          that makes {snapshot.summary.cellId} the priority.
        </p>
        <ul className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {stable.map((cell) => (
            <li key={cell.cellId} className="rounded-lg border border-slate-100 px-3 py-2">
              <div className="font-mono text-xs text-slate-900">{cell.cellId}</div>
              <div className="mt-1 text-xs text-slate-500">{cell.city} · peak anomaly {cell.maxAnomaly.toFixed(2)}</div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
