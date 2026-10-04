"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { formatClock } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";
import { cn } from "@/lib/utils";
import type { MapSample } from "@/components/npm/leaflet-map";

const LeafletMap = dynamic(() => import("@/components/npm/leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#e6eef2]" />,
});

function decorate(samples: MapSample[]) {
  const cities = new Map(snapshot.cells.map((cell) => [cell.cellId, cell.city]));
  return samples.map((sample) => ({
    ...sample,
    city: sample.city || cities.get(sample.cellId) || "",
  }));
}

function rollup(samples: MapSample[]) {
  const sites = new Map<string, { siteId: string; city: string; pass: number; fail: number }>();
  for (const sample of samples) {
    const current = sites.get(sample.siteId) ?? { siteId: sample.siteId, city: sample.city || sample.siteId, pass: 0, fail: 0 };
    if (sample.city) current.city = sample.city;
    if (sample.result === "pass") current.pass += 1;
    else current.fail += 1;
    sites.set(sample.siteId, current);
  }
  return [...sites.values()].sort((a, b) => b.fail - a.fail || a.city.localeCompare(b.city));
}

export function DriveMap({
  samples,
  title,
  caption,
  initialSiteId,
  selectedId: selectedIdProp,
  onSelect,
  framed = true,
}: {
  samples: MapSample[];
  title: string;
  caption?: string;
  initialSiteId?: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  framed?: boolean;
}) {
  const prepared = useMemo(() => decorate(samples), [samples]);
  const sites = useMemo(() => rollup(prepared), [prepared]);
  const startingSite =
    initialSiteId && sites.some((site) => site.siteId === initialSiteId)
      ? initialSiteId
      : (sites.find((site) => site.fail > 0)?.siteId ?? "all");
  const [siteId, setSiteId] = useState(startingSite);
  const [result, setResult] = useState<"all" | "pass" | "fail">("all");
  const [internalId, setInternalId] = useState<string | null>(null);
  const controlled = selectedIdProp !== undefined;
  const selectedId = controlled ? selectedIdProp : internalId;

  function choose(id: string | null) {
    if (!controlled) setInternalId(id);
    onSelect?.(id);
    if (!id) return;
    const sample = prepared.find((item) => item.id === id);
    if (!sample) return;
    if (result === "pass" && sample.result !== "pass") setResult("all");
    if (result === "fail" && sample.result === "pass") setResult("all");
  }

  const siteSamples = siteId === "all" ? prepared : prepared.filter((sample) => sample.siteId === siteId);
  const visible =
    result === "all"
      ? siteSamples
      : siteSamples.filter((sample) => (result === "pass" ? sample.result === "pass" : sample.result !== "pass"));
  const failures = siteSamples
    .filter((sample) => sample.result !== "pass")
    .sort((a, b) => a.t.localeCompare(b.t));
  const selected = prepared.find((sample) => sample.id === selectedId) ?? null;
  const boundsKey = `${siteId}|${result}|${visible.length}`;
  const passedCount = visible.filter((sample) => sample.result === "pass").length;
  const failedCount = visible.length - passedCount;

  return (
    <section className={framed ? "flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white" : "flex h-full flex-col overflow-hidden bg-white"}>
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        {caption ? <p className="mt-1 text-xs leading-5 text-slate-500">{caption}</p> : null}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_15.5rem]">
        <div className="field-map relative h-[520px] border-b border-slate-100 lg:border-r lg:border-b-0">
          {visible.length === 0 ? (
            <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-slate-500">
              No drive tests in this view.
            </p>
          ) : (
            <div className="absolute inset-0">
              <LeafletMap samples={visible} boundsKey={boundsKey} selectedId={selectedId ?? null} onSelect={choose} />
            </div>
          )}
        </div>

        <aside className="flex h-[420px] flex-col lg:h-[520px]">
          <div className="space-y-1 border-b border-slate-100 p-2">
            {sites.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setSiteId("all");
                  choose(null);
                }}
                className={cn(
                  "w-full rounded-lg px-2.5 py-2 text-left text-sm",
                  siteId === "all" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                )}
              >
                All sites
              </button>
            ) : null}
            {sites.map((site) => {
              const active = siteId === site.siteId;
              return (
                <button
                  key={site.siteId}
                  type="button"
                  onClick={() => {
                    setSiteId(site.siteId);
                    choose(null);
                  }}
                  className={cn("w-full rounded-lg px-2.5 py-2 text-left", active ? "bg-slate-900 text-white" : "hover:bg-slate-50")}
                >
                  <span className={cn("block text-sm font-medium", active ? "text-white" : "text-slate-900")}>{site.city}</span>
                  <span className={cn("mt-0.5 block font-mono text-[11px]", active ? "text-slate-300" : "text-slate-500")}>{site.siteId}</span>
                  <span className={cn("mt-1 block text-[11px]", active ? "text-slate-300" : site.fail ? "text-rose-700" : "text-emerald-800")}>
                    {site.fail ? `${site.fail} failed` : "All passed"} · {site.pass} passed
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Failed samples</div>
            {failures.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500">No failed drive tests here.</p>
            ) : (
              <ul>
                {failures.map((sample) => (
                  <li key={sample.id}>
                    <button
                      type="button"
                      onClick={() => choose(sample.id)}
                      className={cn(
                        "w-full border-t border-slate-100 px-3 py-2 text-left",
                        selectedId === sample.id ? "bg-rose-50" : "hover:bg-slate-50",
                      )}
                    >
                      <span className="font-mono text-[11px] text-slate-500">{formatClock(sample.t)}</span>
                      <span className="mt-0.5 block text-sm text-slate-900">{sample.cellId}</span>
                      <span className="text-[11px] text-slate-500">
                        {sample.download == null ? "—" : `${sample.download.toFixed(1)} Mbps`}
                        {sample.latency == null ? "" : ` · ${sample.latency.toFixed(0)} ms`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-2.5 text-xs">
        <FilterChip active={result === "all"} onClick={() => setResult("all")}>
          All results
        </FilterChip>
        <FilterChip active={result === "fail"} onClick={() => setResult("fail")}>
          <span className="h-2 w-2 rounded-full bg-[#be123c]" />
          Failed {failedCount}
        </FilterChip>
        <FilterChip active={result === "pass"} onClick={() => setResult("pass")}>
          <span className="h-2 w-2 rounded-full bg-[#15803d]" />
          Passed {passedCount}
        </FilterChip>
        {selected ? (
          <span className="text-slate-600">
            <span className="font-medium text-slate-900">{selected.cellId}</span>
            {" · "}
            {selected.result === "pass" ? "Passed" : "Failed"}
            {selected.download == null ? "" : ` · ${selected.download.toFixed(1)} Mbps`}
            {" · "}
            {formatClock(selected.t)}
          </span>
        ) : (
          <span className="text-slate-400">Select a failed sample to centre the map on it.</span>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {children}
    </button>
  );
}
