import { SignalExplorer } from "@/components/npm/signal-explorer";
import { PageHeader } from "@/components/npm/ui";

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detection"
        title="Deteriorating behaviour, measured against each cell’s own baseline"
        description="The shaded band is the pipeline cluster window. A cell with no detected windows is behaving inside its recent range and is not promoted."
      />
      <SignalExplorer />
    </div>
  );
}
