"use client";

import { useMemo, useState } from "react";
import { Badge, Panel } from "@/components/npm/ui";
import { formatStamp } from "@/lib/npm/format";
import type { Alarm } from "@/lib/types/npm";

const filters = ["All", "In the cluster", "Duplicate group", "Background"] as const;

export function AlarmBoard({ alarms }: { alarms: Alarm[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [severity, setSeverity] = useState("all");

  const rows = useMemo(() => {
    return alarms
      .filter((alarm) => {
        if (severity !== "all" && alarm.severity !== severity) return false;
        if (filter === "In the cluster") return alarm.clusters.length > 0;
        if (filter === "Duplicate group") return alarm.correlated;
        if (filter === "Background") return alarm.clusters.length === 0;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const rank = (alarm: Alarm) => (alarm.correlated ? 0 : alarm.clusters.length > 0 ? 1 : 2);
        return rank(a) - rank(b) || a.raised.localeCompare(b.raised);
      });
  }, [alarms, filter, severity]);

  const severities = ["all", ...Array.from(new Set(alarms.map((alarm) => alarm.severity)))];

  return (
    <Panel
      title={`${rows.length} alarms in this view`}
      aside={<span className="text-xs text-slate-400">{alarms.length} in the dataset</span>}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === item ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {item}
          </button>
        ))}
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
        >
          {severities.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All severities" : item}
            </option>
          ))}
        </select>
      </div>
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Raised</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Domain</th>
              <th className="px-4 py-2 font-medium">Cell</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Group</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((alarm) => (
              <tr
                key={alarm.id}
                className={
                  alarm.correlated
                    ? "border-t border-teal-100 bg-teal-50/50 align-top"
                    : alarm.clusters.length > 0
                      ? "border-t border-amber-100 bg-amber-50/60 align-top"
                      : "border-t border-slate-100 align-top"
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{formatStamp(alarm.raised)}</td>
                <td className="px-4 py-3"><Badge value={alarm.severity} /></td>
                <td className="px-4 py-3 text-slate-600">{alarm.domain}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{alarm.cellId || alarm.siteId}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{alarm.description}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{alarm.probableCause}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-400">{alarm.code}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {alarm.clusters.length > 0 ? alarm.clusters.join(", ") : "Not grouped"}
                  {alarm.correlated ? <div className="mt-1 text-teal-800">Correlated symptom</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
