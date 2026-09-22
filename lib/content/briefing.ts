export const deliverables = [
  {
    title: "Working proof of concept",
    where: "Overview and the incident investigation",
  },
  {
    title: "Prioritised significant issues",
    where: "Incidents",
  },
  {
    title: "Abnormal or deteriorating behaviour",
    where: "Signals",
  },
  {
    title: "Cross-source correlation",
    where: "Investigation timeline and Evidence",
  },
  {
    title: "Grouped alarms, KPIs, changes, and topology",
    where: "Alarms and the cluster membership",
  },
  {
    title: "Facts, inferences, and recommendations kept apart",
    where: "Every incident decision",
  },
  {
    title: "Benefit in time, consistency, and effort",
    where: "Benefit",
  },
  {
    title: "A realistic NPM scenario",
    where: "LTE cell degradation at JHB-CBD-003-B",
  },
];

export const canvas = [
  {
    label: "Who",
    text: "NPM engineers monitor performance, investigate degradation, and decide the next action. Team leads need the same picture: severity, impact, and what is being recommended.",
  },
  {
    label: "What",
    text: "They struggle to identify, prioritise, and diagnose significant issues when the evidence is split across KPIs, alarms, counters, complaints, drive tests, and topology.",
  },
  {
    label: "Why",
    text: "The useful information does not arrive as one incident. Engineers manually correlate sources, while duplicate alarms hide the few issues that matter.",
  },
  {
    label: "Impact",
    text: "Investigations take longer, diagnosis depends on who is on shift, and degradation can reach customers before the root cause is clear.",
  },
];

export const phases = [
  {
    step: "0",
    title: "Scoping and baseline",
    state: "Scenario chosen",
    detail: "Cell degradation on one Telkom LTE cell. The 75-minute manual baseline is a scenario estimate, not a timed engineer study.",
  },
  {
    step: "1",
    title: "Ingest and normalise",
    state: "Dataset ready",
    detail: "Six synthetic sources share timestamps, site and cell ids, and domain tags so they can be correlated.",
  },
  {
    step: "2",
    title: "Reduce noise",
    state: "Cluster written",
    detail: "Related alarms and symptoms collapse into CL-0001. Background alarms stay outside that incident.",
  },
  {
    step: "3",
    title: "Detect deterioration",
    state: "Detections written",
    detail: "Fifteen-minute windows are scored against a rolling baseline, not only a hard threshold.",
  },
  {
    step: "4",
    title: "Explain the likely cause",
    state: "RCA written",
    detail: "Ranked causes with evidence. Transport backhaul congestion leads. Other causes stay visible.",
  },
  {
    step: "5",
    title: "Separate the claim types",
    state: "Report written",
    detail: "Observed facts, AI inference, and the recommendation are different objects in the output.",
  },
  {
    step: "6",
    title: "Engineer-facing desk",
    state: "This app",
    detail: "Ranked incident, drill-in, and the three-part decision. The desk does not apply a fix.",
  },
  {
    step: "7",
    title: "Measure the benefit",
    state: "Estimate only",
    detail: "Time saved and duplicate suppression are shown as scenario estimates. Consistency is the fixed dataset seed.",
  },
];

export const sources = [
  {
    name: "Network KPIs",
    file: "telkom_network_kpis.csv",
    role: "Accessibility, retainability, throughput, latency, RF quality, PRB, anomaly score.",
  },
  {
    name: "Performance counters",
    file: "telkom_performance_counters.csv",
    role: "RRC and E-RAB failures, drops, packet loss, transport discards.",
  },
  {
    name: "Alarms",
    file: "telkom_alarms.csv",
    role: "Severity, probable cause, and the duplicate group that should collapse into one incident.",
  },
  {
    name: "Drive tests",
    file: "telkom_drive_test_logs.csv",
    role: "Field RSRP, RSRQ, SINR, and throughput, including failed tests.",
  },
  {
    name: "Customer complaints",
    file: "telkom_customer_complaints.csv",
    role: "Ticket class, priority, impact, and sentiment while the cell is degraded.",
  },
  {
    name: "Topology and config",
    file: "telkom_topology_config_change_logs.csv",
    role: "Inventory, neighbour audits, and the protection-path change before the drop.",
  },
];

export const openQuestions = [
  "How many alarms does an engineer actually open on a normal shift?",
  "How long does correlation take before anyone names a cause?",
  "Which source consumes the most of that time?",
  "How are duplicate alarms handled in the current tools?",
  "Where does a senior engineer diverge from a junior one on the same evidence?",
];
