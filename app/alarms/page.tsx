import { AlarmBoard } from "@/components/npm/alarm-board";
import { ProportionBar } from "@/components/npm/magnitude";
import { Metric, PageHeader } from "@/components/npm/ui";
import { backgroundAlarms, correlatedAlarms } from "@/lib/npm/derive";
import { formatPct } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";

export default function AlarmsPage() {
  const correlated = correlatedAlarms();
  const background = backgroundAlarms();
  const grouped = snapshot.alarms.filter((alarm) => alarm.clusters.length > 0);
  const extra = grouped.filter((alarm) => !alarm.correlated).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Noise reduction"
        title="Related alarms collapse into one incident"
        description="Duplicate group first. The time-window alarm stays marked."
      />
      <ProportionBar
        title={`${correlated.length} alarms are one duplicate group`}
        caption="Teal is the duplicate group. Amber joined on the time window only."
        segments={[
          { id: "group", label: "duplicate group", value: correlated.length, color: "#0f766e" },
          { id: "extra", label: "time-window only", value: extra, color: "#b45309" },
          { id: "background", label: "left as background", value: background.length, color: "#475569" },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Alarms in view" value={String(snapshot.alarms.length)} detail="Two-day synthetic extract" />
        <Metric label="In the cluster" value={String(grouped.length)} detail={extra ? `${extra} joined on time window only` : "All of them are in the duplicate group"} />
        <Metric label="Duplicate group" value={String(correlated.length)} detail={`${formatPct(snapshot.summary.duplicateSuppressedPct, 1)} marked suppressible in the summary`} />
        <Metric label="Left as background" value={String(background.length)} detail="Not opened as their own incident" />
      </div>
      <AlarmBoard alarms={snapshot.alarms} />
    </div>
  );
}
