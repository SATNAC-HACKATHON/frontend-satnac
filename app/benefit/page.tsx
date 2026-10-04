import { MagnitudeChart } from "@/components/npm/magnitude";
import { ArtifactGaps, EpistemicPanel, Metric, PageHeader } from "@/components/npm/ui";
import { openQuestions } from "@/lib/content/briefing";
import { artifactGaps } from "@/lib/npm/derive";
import { formatPct } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";

export default function BenefitPage() {
  const summary = snapshot.summary;
  const cluster = snapshot.clusters[0];
  const gaps = cluster ? artifactGaps(cluster) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Benefit"
        title={`This scenario is ${summary.savedMinutes} minutes shorter with the desk`}
        description="Scenario estimate, until an engineer times this case."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Manual baseline" value={`${summary.manualMinutes} min`} detail="Scenario estimate, not a stopwatch study" />
        <Metric label="Assisted path" value={`${summary.assistedMinutes} min`} detail="Reading the clustered decision instead of raw streams" />
        <Metric label="Difference" value={`${summary.savedMinutes} min`} detail="Potential, on this one injected incident" />
      </div>

      <MagnitudeChart
        title="Manual correlation versus the desk"
        caption="Minutes from the incident summary."
        max={summary.manualMinutes}
        unit=" min"
        rows={[
          { id: "manual", label: "Manual correlation", value: summary.manualMinutes, tone: "ink" },
          { id: "assisted", label: "With this desk", value: summary.assistedMinutes, tone: "steady" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <EpistemicPanel kind="fact" title="Noise that can be grouped" source="incident_summary.csv">
          {formatPct(summary.duplicateSuppressedPct, 1)} of the incident alarm group is marked as a duplicate or correlated symptom.
          Six alarms share one duplicate group, so an engineer can open the group once.
        </EpistemicPanel>
        <EpistemicPanel kind="inference" title="Consistency of this run" source={`seed ${snapshot.manifest.seed}`}>
          The dataset generator and the pipeline are deterministic for seed {snapshot.manifest.seed}. The same inputs produce the same cluster, the same ranked causes, and the same recommendation. That is the current proxy for diagnosis consistency.
        </EpistemicPanel>
        <EpistemicPanel kind="recommendation" title="What to measure with an engineer" source="Phase 0 still open">
          Time a senior and a junior engineer on the raw extracts, then on this desk. Record time to name the cause, whether they agree, and which source they opened first.
        </EpistemicPanel>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-950">Still needed before the benefit is a result</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {openQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>

      <ArtifactGaps gaps={gaps} />
    </div>
  );
}
