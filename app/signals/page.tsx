import { SignalExplorer } from "@/components/npm/signal-explorer";
import { PageHeader } from "@/components/npm/ui";

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detection"
        title="One cell left its baseline. The others did not."
        description="Each small chart uses the same 70–100% accessibility scale. Open a cell to read throughput, latency, loss, and the model score underneath."
      />
      <SignalExplorer />
    </div>
  );
}
