import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ArtifactGap } from "@/lib/types/npm";

const tones: Record<string, string> = {
  critical: "bg-rose-50 text-rose-800 ring-rose-200",
  major: "bg-amber-50 text-amber-950 ring-amber-200",
  minor: "bg-sky-50 text-sky-900 ring-sky-200",
  warning: "bg-slate-100 text-slate-700 ring-slate-200",
  degraded: "bg-rose-50 text-rose-800 ring-rose-200",
  stable: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  high: "bg-amber-50 text-amber-950 ring-amber-200",
  medium: "bg-slate-100 text-slate-700 ring-slate-200",
  pass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  fail: "bg-rose-50 text-rose-800 ring-rose-200",
  fact: "bg-slate-900 text-white ring-slate-900",
  inference: "bg-amber-700 text-white ring-amber-700",
  recommendation: "bg-teal-800 text-white ring-teal-800",
};

export function Badge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const tone = tones[value.toLowerCase()] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        tone,
        className,
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.7rem]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 font-mono text-[1.65rem] font-semibold leading-none tracking-tight text-slate-950">{value}</div>
      {detail ? <p className="mt-2 text-sm leading-5 text-slate-500">{detail}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  aside,
  children,
  className,
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const epistemicBorder = {
  fact: "border-l-slate-900",
  inference: "border-l-amber-600",
  recommendation: "border-l-teal-700",
} as const;

export function EpistemicPanel({
  kind,
  title,
  source,
  children,
}: {
  kind: keyof typeof epistemicBorder;
  title: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <article className={cn("rounded-xl border border-slate-200 border-l-4 bg-white", epistemicBorder[kind])}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <Badge value={kind} />
          <h2 className="mt-2 text-sm font-semibold text-slate-950">{title}</h2>
        </div>
        <p className="max-w-[9rem] text-right font-mono text-[10px] leading-4 text-slate-400">{source}</p>
      </div>
      <div className="px-4 py-4 text-sm leading-6 text-slate-700">{children}</div>
    </article>
  );
}

export function ReadingKey() {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <Badge value="fact" /> measured or recorded
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Badge value="inference" /> model judgement
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Badge value="recommendation" /> suggested next step, not an applied fix
      </span>
    </div>
  );
}

export function ArtifactGaps({ gaps }: { gaps: ArtifactGap[] }) {
  if (gaps.length === 0) return null;
  return (
    <Panel title="Two outputs, kept separate" aside={<span className="text-xs text-slate-400">Do not average these</span>}>
      <p className="px-4 pt-3 text-sm leading-6 text-slate-600">
        The scenario summary and the pipeline cluster describe the same demo, but they do not agree on every count.
        Each number below keeps the file it came from.
      </p>
      <div className="overflow-x-auto px-2 py-3">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-2 py-2 font-medium">Field</th>
              <th className="px-2 py-2 font-medium">Incident summary</th>
              <th className="px-2 py-2 font-medium">Pipeline cluster</th>
              <th className="px-2 py-2 font-medium">Why it differs</th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((gap) => (
              <tr key={gap.field} className="border-t border-slate-100 align-top">
                <td className="px-2 py-3 font-medium text-slate-900">{gap.field}</td>
                <td className="px-2 py-3 text-slate-700">{gap.summary}</td>
                <td className="px-2 py-3 text-slate-700">{gap.pipeline}</td>
                <td className="px-2 py-3 text-slate-500">{gap.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-teal-800 hover:text-teal-950">
      {children}
    </Link>
  );
}
