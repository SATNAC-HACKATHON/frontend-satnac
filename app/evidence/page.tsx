import { EvidenceBoard } from "@/components/npm/evidence-board";
import { PageHeader } from "@/components/npm/ui";
import { snapshot } from "@/lib/npm/snapshot";

export default function EvidencePage() {
  const cluster = snapshot.clusters[0];
  const counts = [
    {
      id: "KPI windows" as const,
      dataset: snapshot.manifest.rowCounts.network_kpis ?? 0,
      inCluster: snapshot.detections.length,
      note: "Detected windows. Packet loss and transport discards from the counters are included here and on Signals.",
    },
    {
      id: "Alarms" as const,
      dataset: snapshot.manifest.rowCounts.alarms ?? 0,
      inCluster: cluster?.alarmCount ?? 0,
      note: "Cluster membership, including the untagged door alarm.",
    },
    {
      id: "Complaints" as const,
      dataset: snapshot.manifest.rowCounts.customer_complaints ?? 0,
      inCluster: cluster?.complaintCount ?? 0,
      note: "Tickets the cluster attached to the degraded cell.",
    },
    {
      id: "Drive tests" as const,
      dataset: snapshot.manifest.rowCounts.drive_test_logs ?? 0,
      inCluster: cluster?.driveTestCount ?? 0,
      note: "Field samples inside the cluster, passed and failed.",
    },
    {
      id: "Topology" as const,
      dataset: snapshot.manifest.rowCounts.topology_config_change_logs ?? 0,
      inCluster: cluster?.topologyCount ?? 0,
      note: "The full change log is listed. Only two events joined the cluster.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Correlation"
        title="The same incident, seen from each source"
        description="Root-cause work needs the KPI drop, the counters, the alarms, the complaints, the drive tests, and the config change in one place. Counts below are cluster membership, not the whole dataset."
      />
      <EvidenceBoard
        detections={snapshot.detections}
        alarms={snapshot.alarms.filter((alarm) => cluster && alarm.clusters.includes(cluster.clusterId))}
        complaints={snapshot.complaints.filter((row) => cluster && row.clusters.includes(cluster.clusterId))}
        driveTests={snapshot.driveTests.filter((row) => cluster && row.clusters.includes(cluster.clusterId))}
        topology={snapshot.topology}
        counts={counts}
      />
    </div>
  );
}
