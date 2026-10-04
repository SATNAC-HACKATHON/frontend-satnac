"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { formatClock } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";
import { cn } from "@/lib/utils";
import type { MapSample } from "@/components/npm/leaflet-map";

const LeafletMap = dynamic(() => import("@/components/npm/leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

const fieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-100";

function decorate(samples: MapSample[]) {
  const cities = new Map(snapshot.cells.map((cell) => [cell.cellId, cell.city]));
  return samples.map((sample) => ({
    ...sample,
    city: sample.city || cities.get(sample.cellId) || "",
  }));
}

function rollup(samples: MapSample[]) {
  const sites = new Map<string, { siteId: string; city: string; fail: number }>();
  for (const sample of samples) {
    const current = sites.get(sample.siteId) ?? { siteId: sample.siteId, city: sample.city || sample.siteId, fail: 0 };
    if (sample.city) current.city = sample.city;
    if (sample.result !== "pass") current.fail += 1;
    sites.set(sample.siteId, current);
  }
  return [...sites.values()].sort((a, b) => b.fail - a.fail || a.city.localeCompare(b.city));
}

export function DriveMap({
  samples,
  title,
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
  const defaultSite =
    initialSiteId && sites.some((site) => site.siteId === initialSiteId)
      ? initialSiteId
      : (sites.find((site) => site.fail > 0)?.siteId ?? sites[0]?.siteId ?? "all");
  const defaultResult = prepared.some((sample) => sample.siteId === defaultSite && sample.result !== "pass") ? "fail" : "all";

  const [siteId, setSiteId] = useState(defaultSite);
  const [cellId, setCellId] = useState("all");
  const [result, setResult] = useState<"all" | "pass" | "fail">(defaultResult);
  const [internalId, setInternalId] = useState<string | null>(null);
  const controlled = selectedIdProp !== undefined;
  const selectedId = controlled ? selectedIdProp : internalId;

  function choose(id: string | null) {
    if (!controlled) setInternalId(id);
    onSelect?.(id);
  }

  const siteSamples = siteId === "all" ? prepared : prepared.filter((sample) => sample.siteId === siteId);
  const cells = [...new Set(siteSamples.map((sample) => sample.cellId))].sort();
  const cellSamples = cellId === "all" ? siteSamples : siteSamples.filter((sample) => sample.cellId === cellId);
  const visible =
    result === "all"
      ? cellSamples
      : cellSamples.filter((sample) => (result === "pass" ? sample.result === "pass" : sample.result !== "pass"));
  const failures = cellSamples.filter((sample) => sample.result !== "pass").sort((a, b) => a.t.localeCompare(b.t));
  const selected = prepared.find((sample) => sample.id === selectedId) ?? null;
  const boundsKey = `${siteId}|${cellId}|${result}|${visible.length}`;
  const cityName = sites.find((site) => site.siteId === siteId)?.city;
  const filtered = siteId !== defaultSite || cellId !== "all" || result !== defaultResult || Boolean(selectedId);

  function reset() {
    setSiteId(defaultSite);
    setCellId("all");
    setResult(defaultResult);
    choose(null);
  }

  return (
    <section className={cn("overflow-hidden bg-white", framed && "rounded-2xl border border-slate-200 shadow-sm")}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          <p className="text-xs text-slate-500">
            {visible.length} on the map
            {cityName ? ` · ${cityName}` : ""}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">City</span>
            <select
              className={fieldClass}
              value={siteId}
              onChange={(event) => {
                setSiteId(event.target.value);
                setCellId("all");
                choose(null);
              }}
            >
              {sites.length > 1 ? <option value="all">All cities</option> : null}
              {sites.map((site) => (
                <option key={site.siteId} value={site.siteId}>
                  {site.city}
                  {site.fail ? ` · ${site.fail} failed` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Cell</span>
            <select
              className={fieldClass}
              value={cellId}
              onChange={(event) => {
                setCellId(event.target.value);
                choose(null);
              }}
            >
              <option value="all">All cells</option>
              {cells.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Result</span>
            <select
              className={fieldClass}
              value={result}
              onChange={(event) => {
                setResult(event.target.value as "all" | "pass" | "fail");
                choose(null);
              }}
            >
              <option value="fail">Failed</option>
              <option value="pass">Passed</option>
              <option value="all">Failed and passed</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Failed test</span>
            <select
              className={fieldClass}
              value={failures.some((sample) => sample.id === selectedId) ? selectedId ?? "" : ""}
              onChange={(event) => {
                const id = event.target.value;
                if (!id) {
                  choose(null);
                  return;
                }
                if (result === "pass") setResult("fail");
                choose(id);
              }}
            >
              <option value="">{failures.length ? `${failures.length} failed tests` : "No failed tests"}</option>
              {failures.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {formatClock(sample.t)} · {sample.cellId}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="text-slate-500">
            {selected
              ? `${selected.cellId} · ${selected.result === "pass" ? "Passed" : "Failed"} · ${formatClock(selected.t)}${selected.download == null ? "" : ` · ${selected.download.toFixed(1)} Mbps`}`
              : "Click a mark for the test."}
          </p>
          {filtered ? (
            <button type="button" onClick={reset} className="shrink-0 font-medium text-sky-700 hover:text-sky-800">
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="field-map relative h-[560px]">
        {visible.length === 0 ? (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-slate-500">
            Nothing matches these filters.
          </p>
        ) : (
          <div className="absolute inset-0">
            <LeafletMap samples={visible} boundsKey={boundsKey} selectedId={selectedId ?? null} onSelect={choose} />
          </div>
        )}
      </div>
    </section>
  );
}
