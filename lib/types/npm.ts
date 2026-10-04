/**
 * Frontend contract for the Telkom NPM proof of concept.
 *
 * Numbers come from backend-machineL via scripts/build-snapshot.py.
 * Series tuples follow `seriesFields` / `baselineFields` in the snapshot.
 */

export type SeriesPoint = [
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number | null,
  number | null,
  number | null,
  number | null,
];

export type BaselinePoint = [string, number | null, number | null];

export type CellStatus = "degraded" | "stable";

export type CellRollup = {
  cellId: string;
  siteId: string;
  city: string;
  region: string;
  band: string;
  samples: number;
  degradedSamples: number;
  maxAnomaly: number;
  minAccessibility: number;
  minThroughput: number;
  status: CellStatus;
};

export type RankedCause = {
  rootCause: string;
  score: number;
  evidence: string[];
};

export type PipelineCluster = {
  clusterId: string;
  siteId: string;
  cellId: string;
  start: string;
  end: string;
  rawEventCount: number;
  alarmCount: number;
  complaintCount: number;
  driveTestCount: number;
  topologyCount: number;
  detectionCount: number;
  predictedRootCause: string;
  confidence: number;
  rankedCandidates: RankedCause[];
};

export type ScenarioSummary = {
  incidentId: string;
  operator: string;
  scenario: string;
  siteId: string;
  cellId: string;
  start: string;
  end: string;
  severity: string;
  domain: string;
  rawEventsClustered: number;
  duplicateSuppressedPct: number;
  manualMinutes: number;
  assistedMinutes: number;
  savedMinutes: number;
  observedFacts: string;
  aiInference: string;
  recommendation: string;
  confidence: number;
};

export type EngineerReport = {
  facts: string[];
  inference: string[];
  recommendation: string[];
};

export type Detection = {
  t: string;
  cellId: string;
  siteId: string;
  score: number;
  severity: string;
  issue: string;
  accessibility: number;
  baselineAccessibility: number;
  throughput: number;
  baselineThroughput: number;
  packetLoss: number;
  discards: number;
  latency: number;
};

export type Alarm = {
  id: string;
  raised: string;
  cleared: string;
  siteId: string;
  cellId: string;
  domain: string;
  severity: string;
  code: string;
  description: string;
  probableCause: string;
  duplicateGroup: string;
  correlated: boolean;
  incidentId: string;
  clusters: string[];
};

export type Complaint = {
  id: string;
  opened: string;
  siteId: string;
  cellId: string;
  area: string;
  classification: string;
  priority: string;
  impact: string;
  slaMinutes: number;
  sentiment: number;
  incidentId: string;
  clusters: string[];
};

export type DriveTest = {
  id: string;
  t: string;
  siteId: string;
  cellId: string;
  lat: number;
  lng: number;
  rsrp: number;
  rsrq: number;
  sinr: number;
  latency: number;
  download: number;
  upload: number;
  result: string;
  incidentId: string;
  clusters: string[];
};

/** Every drive-test coordinate from the raw log, including sites outside the incident. */
export type GeoSample = {
  id: string;
  t: string;
  siteId: string;
  cellId: string;
  city: string;
  lat: number;
  lng: number;
  rsrp: number | null;
  sinr: number | null;
  latency: number | null;
  download: number | null;
  result: string;
  clusters: string[];
};

export type TopologyEvent = {
  id: string;
  t: string;
  siteId: string;
  cellId: string;
  domain: string;
  eventType: string;
  objectName: string;
  summary: string;
  changedBy: string;
  parent: string;
  azimuth: number | null;
  mechanicalTilt: number | null;
  electricalTilt: number | null;
  incidentId: string;
  clusters: string[];
};

export type NpmSnapshot = {
  seriesFields: string[];
  baselineFields: string[];
  manifest: {
    datasetName: string;
    seed: number;
    scenario: string;
    start: string;
    end: string;
    rowCounts: Record<string, number>;
    sourceNote: string;
  };
  summary: ScenarioSummary;
  engineerReport: EngineerReport;
  clusters: PipelineCluster[];
  cells: CellRollup[];
  series: Record<string, SeriesPoint[]>;
  baselines: Record<string, BaselinePoint[]>;
  detections: Detection[];
  alarms: Alarm[];
  complaints: Complaint[];
  driveTests: DriveTest[];
  geoSamples: GeoSample[];
  topology: TopologyEvent[];
};

export type ChartPoint = {
  t: string;
  accessibility: number;
  baselineAccessibility: number | null;
  throughput: number;
  baselineThroughput: number | null;
  latency: number;
  prb: number;
  anomaly: number;
  dropRate: number;
  packetLoss: number | null;
  discards: number | null;
  rrcFailures: number | null;
  erabFailures: number | null;
};

export type ArtifactGap = {
  field: string;
  summary: string;
  pipeline: string;
  why: string;
};

export type TimelineItem = {
  t: string;
  title: string;
  detail: string;
  source: string;
  kind: "fact" | "inference";
  caution?: boolean;
};
