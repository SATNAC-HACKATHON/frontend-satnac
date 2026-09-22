import { snapshot } from "@/lib/npm/snapshot";
import type {
  Alarm,
  ArtifactGap,
  ChartPoint,
  Complaint,
  DriveTest,
  PipelineCluster,
  TimelineItem,
  TopologyEvent,
} from "@/lib/types/npm";

export function chartPoints(cellId: string): ChartPoint[] {
  const baselines = new Map((snapshot.baselines[cellId] ?? []).map((row) => [row[0], row]));
  return (snapshot.series[cellId] ?? []).map((row) => {
    const baseline = baselines.get(row[0]);
    return {
      t: row[0],
      accessibility: row[1],
      throughput: row[2],
      latency: row[3],
      prb: row[4],
      anomaly: row[5],
      dropRate: row[6],
      packetLoss: row[7],
      discards: row[8],
      rrcFailures: row[9],
      erabFailures: row[10],
      baselineAccessibility: baseline?.[1] ?? null,
      baselineThroughput: baseline?.[2] ?? null,
    };
  });
}

export function findCluster(id: string) {
  return snapshot.clusters.find((cluster) => cluster.clusterId === id || snapshot.summary.incidentId === id);
}

export function peakDetection(cellId: string) {
  const rows = snapshot.detections.filter((row) => row.cellId === cellId);
  return rows.reduce<(typeof rows)[number] | null>((best, row) => {
    if (!best || row.score > best.score) return row;
    return best;
  }, null);
}

export function siblingsOf(cellId: string) {
  const cell = snapshot.cells.find((item) => item.cellId === cellId);
  if (!cell) return [];
  return snapshot.cells.filter((item) => item.siteId === cell.siteId && item.cellId !== cellId);
}

export function taggedCount(incidentId: string, rows: { incidentId: string }[]) {
  return rows.filter((row) => row.incidentId === incidentId).length;
}

export function artifactGaps(cluster: PipelineCluster): ArtifactGap[] {
  const summary = snapshot.summary;
  const gaps: ArtifactGap[] = [];

  if (summary.start !== cluster.start || summary.end !== cluster.end) {
    gaps.push({
      field: "Incident window",
      summary: `${summary.start.replace("T", " ")} to ${summary.end.replace("T", " ")}`,
      pipeline: `${cluster.start.replace("T", " ")} to ${cluster.end.replace("T", " ")}`,
      why: "The summary uses the injected degradation. The pipeline cluster uses the detection window around it.",
    });
  }

  if (summary.confidence !== cluster.confidence) {
    gaps.push({
      field: "Confidence",
      summary: String(summary.confidence),
      pipeline: String(cluster.confidence),
      why: "These are different scoring outputs. They should stay labeled rather than averaged.",
    });
  }

  if (summary.rawEventsClustered !== cluster.rawEventCount) {
    gaps.push({
      field: "Grouped events",
      summary: String(summary.rawEventsClustered),
      pipeline: String(cluster.rawEventCount),
      why: "The summary and the cluster file count membership differently.",
    });
  }

  const summaryAlarms = taggedCount(summary.incidentId, snapshot.alarms);
  if (summaryAlarms !== cluster.alarmCount) {
    gaps.push({
      field: "Alarms",
      summary: `${summaryAlarms} tagged with the incident id`,
      pipeline: `${cluster.alarmCount} placed in ${cluster.clusterId}`,
      why: "Time-window clustering can pull in an alarm that was never tagged to the incident.",
    });
  }

  const summaryComplaints = taggedCount(summary.incidentId, snapshot.complaints);
  if (summaryComplaints !== cluster.complaintCount) {
    gaps.push({
      field: "Complaints",
      summary: `${summaryComplaints} tagged with the incident id`,
      pipeline: `${cluster.complaintCount} placed in ${cluster.clusterId}`,
      why: "The cluster window is wider than the tagged incident rows.",
    });
  }

  const summaryDrives = taggedCount(summary.incidentId, snapshot.driveTests);
  if (summaryDrives !== cluster.driveTestCount) {
    gaps.push({
      field: "Drive tests",
      summary: `${summaryDrives} tagged with the incident id`,
      pipeline: `${cluster.driveTestCount} placed in ${cluster.clusterId}`,
      why: "Samples inside the cluster window are grouped even when they are not incident-tagged.",
    });
  }

  return gaps;
}

export function clusterAlarms(clusterId: string) {
  return snapshot.alarms
    .filter((alarm) => alarm.clusters.includes(clusterId))
    .sort((a, b) => a.raised.localeCompare(b.raised));
}

export function buildTimeline(cluster: PipelineCluster): TimelineItem[] {
  const items: TimelineItem[] = [];
  const alarms = clusterAlarms(cluster.clusterId);
  const topology = snapshot.topology
    .filter((event) => event.clusters.includes(cluster.clusterId))
    .sort((a, b) => a.t.localeCompare(b.t));
  const detections = snapshot.detections
    .filter((row) => row.cellId === cluster.cellId)
    .sort((a, b) => a.t.localeCompare(b.t));
  const complaints = snapshot.complaints
    .filter((row) => row.clusters.includes(cluster.clusterId))
    .sort((a, b) => a.opened.localeCompare(b.opened));
  const drives = snapshot.driveTests
    .filter((row) => row.clusters.includes(cluster.clusterId) && row.result !== "pass")
    .sort((a, b) => a.t.localeCompare(b.t));

  for (const event of topology) {
    items.push({
      t: event.t,
      kind: "fact",
      title: event.eventType.replaceAll("_", " "),
      detail: event.summary,
      source: event.id,
    });
  }

  if (detections[0]) {
    items.push({
      t: detections[0].t,
      kind: "inference",
      title: `Degradation detected · ${detections[0].severity}`,
      detail: `Detection score ${detections[0].score.toFixed(1)}. Accessibility ${detections[0].accessibility.toFixed(1)}% against a ${detections[0].baselineAccessibility.toFixed(1)}% baseline.`,
      source: "detected_degradations.csv",
    });
  }

  for (const alarm of alarms) {
    const untagged = !alarm.incidentId;
    items.push({
      t: alarm.raised,
      kind: "fact",
      caution: untagged,
      title: alarm.description,
      detail: untagged
        ? `${alarm.code} on ${alarm.cellId || alarm.siteId}. No incident id. The cluster included it because it falls inside the time window.`
        : `${alarm.severity} · ${alarm.code} · ${alarm.domain}. Duplicate group ${alarm.duplicateGroup || "none"}.`,
      source: alarm.id,
    });
  }

  if (complaints[0]) {
    items.push({
      t: complaints[0].opened,
      kind: "fact",
      title: `${complaints.length} customer complaints enter the cluster`,
      detail: `First ticket ${complaints[0].id} · ${complaints[0].classification}. ${taggedCount(snapshot.summary.incidentId, complaints)} of them carry the incident id.`,
      source: "telkom_customer_complaints.csv",
    });
  }

  if (drives[0]) {
    items.push({
      t: drives[0].t,
      kind: "fact",
      title: `${drives.length} drive tests failed inside the cluster`,
      detail: `First failed sample ${drives[0].id} on ${drives[0].cellId}. Download ${drives[0].download.toFixed(1)} Mbps.`,
      source: "telkom_drive_test_logs.csv",
    });
  }

  const peak = peakDetection(cluster.cellId);
  if (peak && peak.t !== detections[0]?.t) {
    items.push({
      t: peak.t,
      kind: "inference",
      title: `Worst detection · ${peak.severity}`,
      detail: `Score ${peak.score.toFixed(1)}. Downlink ${peak.throughput.toFixed(1)} Mbps against a ${peak.baselineThroughput.toFixed(1)} Mbps baseline. Packet loss ${peak.packetLoss.toFixed(2)}%.`,
      source: "detected_degradations.csv",
    });
  }

  return items.sort((a, b) => a.t.localeCompare(b.t));
}

export function backgroundAlarms() {
  return snapshot.alarms.filter((alarm) => alarm.clusters.length === 0);
}

export function correlatedAlarms() {
  return snapshot.alarms.filter((alarm) => alarm.correlated);
}

export type IncidentQueueItem = {
  cluster: PipelineCluster;
  severity: string;
  peakScore: number;
  city: string;
  region: string;
  band: string;
};

export function incidentQueue(): IncidentQueueItem[] {
  return snapshot.clusters
    .map((cluster) => {
      const cell = snapshot.cells.find((item) => item.cellId === cluster.cellId);
      const peak = peakDetection(cluster.cellId);
      return {
        cluster,
        severity: peak?.severity ?? snapshot.summary.severity,
        peakScore: peak?.score ?? 0,
        city: cell?.city ?? "",
        region: cell?.region ?? "",
        band: cell?.band ?? "",
      };
    })
    .sort((a, b) => b.peakScore - a.peakScore);
}

export function complaintsFor(clusterId: string): Complaint[] {
  return snapshot.complaints
    .filter((row) => row.clusters.includes(clusterId))
    .sort((a, b) => a.opened.localeCompare(b.opened));
}

export function drivesFor(clusterId: string): DriveTest[] {
  return snapshot.driveTests
    .filter((row) => row.clusters.includes(clusterId))
    .sort((a, b) => a.t.localeCompare(b.t));
}

export function topologyFor(clusterId: string): TopologyEvent[] {
  return snapshot.topology
    .filter((row) => row.clusters.includes(clusterId))
    .sort((a, b) => a.t.localeCompare(b.t));
}

export function alarmsInCluster(clusterId: string): Alarm[] {
  return clusterAlarms(clusterId);
}
