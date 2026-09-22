import { AlarmBoard } from "@/components/npm/alarm-board";
import { Metric, PageHeader } from "@/components/npm/ui";
import { backgroundAlarms, correlatedAlarms } from "@/lib/npm/derive";
import { formatPct } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";

export default function AlarmsPage() {
  const correlated = correlatedAlarms();
  const background = backgroundAlarms();
  const grouped = snapshot.alarms.filter((alarm) => alarm.clusters.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Noise reduction"
        title="Related alarms collapse into one incident"
        description="Six transport and RAN symptoms share one duplicate group. The cluster also picked up a cabinet-door alarm that only overlaps in time. That extra alarm stays visible so the grouping can be challenged."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Alarms in view" value={String(snapshot.alarms.length)} detail="Two-day synthetic extract" />
        <Metric label="In the cluster" value={String(grouped.length)} detail="Including one untagged time-window match" />
        <Metric label="Duplicate group" value={String(correlated.length)} detail={`${formatPct(snapshot.summary.duplicateSuppressedPct, 1)} marked suppressible in the summary`} />
        <Metric label="Left as background" value={String(background.length)} detail="Not opened as their own incident" />
      </div>
      <AlarmBoard alarms={snapshot.alarms} />
    </div>
  );
}
