import { SignalExplorer } from "@/components/npm/signal-explorer";
import { PageHeader } from "@/components/npm/ui";

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detection"
        title="Cell signals"
        description="Same 70–100% scale. Open a cell for the detail."
      />
      <SignalExplorer />
    </div>
  );
}
