import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">Not in this scenario</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950">That incident is not in the current snapshot.</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        The desk only opens clusters written by the pipeline. Refresh the snapshot after the next model run.
      </p>
      <Link href="/incidents" className="mt-5 inline-block text-sm font-semibold text-teal-800">
        Back to incidents
      </Link>
    </div>
  );
}
