import Link from "next/link";
import { canvas, deliverables, phases, sources } from "@/lib/content/briefing";
import { snapshot } from "@/lib/npm/snapshot";

export default function BriefingPage() {
  const cluster = snapshot.clusters[0];

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">SATNAC ISC 2026 · Topic 5</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          AI-assisted network performance decisions
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          NPM engineers are buried in duplicate alarms and split evidence. This desk turns the synthetic Telkom
          cell-degradation scenario into one ranked incident. Observed facts, model inferences, and the recommended
          next step stay apart. Drive-test coordinates are drawn on a street map, and the charts use a shared scale
          so the degraded cell can be seen without reading a table first.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/overview" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Open the desk
          </Link>
          {cluster ? (
            <Link
              href={`/incidents/${cluster.clusterId}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Open {cluster.clusterId}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {canvas.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-950">What the challenge asked for</h2>
        <p className="mt-1 text-sm text-slate-500">Each deliverable has a place in the desk, so the demo can be walked in order.</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {deliverables.map((item, index) => (
            <li key={item.title} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="font-mono text-[11px] text-slate-400">0{index + 1}</div>
              <div className="mt-1 text-sm font-semibold text-slate-950">{item.title}</div>
              <div className="mt-1 text-sm text-slate-500">{item.where}</div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-950">Pipeline this UI sits on</h2>
        <ol className="mt-4 space-y-2">
          {phases.map((phase) => (
            <li key={phase.step} className="grid gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span className="font-mono text-xs text-slate-400">{phase.step}</span>
              <div>
                <div className="text-sm font-semibold text-slate-950">{phase.title}</div>
                <p className="mt-0.5 text-sm text-slate-500">{phase.detail}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">{phase.state}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-950">Sources the model can see</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <article key={source.file} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-950">{source.name}</h3>
              <p className="mt-1 font-mono text-[11px] text-slate-400">{source.file}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{source.role}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">{snapshot.manifest.sourceNote}</p>
      </section>
    </div>
  );
}
