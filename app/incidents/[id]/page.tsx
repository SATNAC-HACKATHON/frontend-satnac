import { notFound } from "next/navigation";
import { InvestigationView } from "@/components/npm/investigation-view";
import { ArtifactGaps, Badge, PageHeader, ReadingKey } from "@/components/npm/ui";
import {
  alarmsInCluster,
  artifactGaps,
  buildTimeline,
  chartPoints,
  complaintsFor,
  drivesFor,
  findCluster,
  peakDetection,
  siblingsOf,
  topologyFor,
} from "@/lib/npm/derive";
import { formatPct, formatWindow } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";

export function generateStaticParams() {
  return snapshot.clusters.map((cluster) => ({ id: cluster.clusterId }));
}

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cluster = findCluster(id);
  if (!cluster) notFound();

  const peak = peakDetection(cluster.cellId);
  const siblings = siblingsOf(cluster.cellId);
  const gaps = artifactGaps(cluster);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${cluster.clusterId} · ${snapshot.summary.incidentId}`}
        title={cluster.predictedRootCause}
        description={`${cluster.cellId} at ${cluster.siteId}. ${formatWindow(cluster.start, cluster.end)}. Peak detection ${peak ? peak.score.toFixed(0) : "—"} · pipeline confidence ${formatPct(cluster.confidence * 100, 0)}.`}
        action={<ReadingKey />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge value={peak?.severity ?? snapshot.summary.severity} />
        <Badge value={snapshot.summary.domain} />
        <span className="text-sm text-slate-600">
          {siblings.filter((cell) => cell.status === "stable").map((cell) => cell.cellId).join(" and ") || "No sibling"} stayed stable on the same site.
        </span>
      </div>

      <ArtifactGaps gaps={gaps} />

      <InvestigationView
        cluster={cluster}
        summary={snapshot.summary}
        report={snapshot.engineerReport}
        timeline={buildTimeline(cluster)}
        series={chartPoints(cluster.cellId)}
        alarms={alarmsInCluster(cluster.clusterId)}
        complaints={complaintsFor(cluster.clusterId)}
        driveTests={drivesFor(cluster.clusterId)}
        topology={topologyFor(cluster.clusterId)}
      />
    </div>
  );
}
