"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Database,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  Menu,
  X,
} from "lucide-react";
import { formatRange } from "@/lib/npm/format";
import { snapshot } from "@/lib/npm/snapshot";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: ListOrdered },
  { href: "/signals", label: "Signals", icon: Activity },
  { href: "/alarms", label: "Alarms", icon: Bell },
  { href: "/evidence", label: "Evidence", icon: Database },
  { href: "/benefit", label: "Benefit", icon: Gauge },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const incident = snapshot.clusters[0];

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-800/50 bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link href="/overview" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-600 text-sm font-semibold text-white">
            NPM
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-white">NPM Desk</span>
            <span className="block text-[11px] text-slate-400">Decision support</span>
          </span>
        </Link>
        <button className="rounded-md p-1 text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
                active ? "bg-sky-500/10 text-sky-400" : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-3">
        {incident ? (
          <Link
            href={`/incidents/${incident.clusterId}`}
            onClick={() => setOpen(false)}
            className="block rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Open incident</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className="font-mono text-xs text-white">{incident.cellId}</span>
            </div>
            <div className="mt-1 text-xs leading-4 text-slate-400">{incident.predictedRootCause}</div>
          </Link>
        ) : null}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            pathname === "/" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}
        >
          <BookOpen className="h-4 w-4" />
          Challenge brief
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[260px]">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-1.5 text-slate-600 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Synthetic Telkom</span>
              <span className="hidden md:inline"> · {formatRange(snapshot.manifest.start, snapshot.manifest.end)}</span>
              <span className="hidden text-slate-400 lg:inline"> · not a live feed</span>
            </p>
          </div>
          {incident ? (
            <Link
              href={`/incidents/${incident.clusterId}`}
              className="inline-flex max-w-[16rem] items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs sm:max-w-none"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
              <span className="truncate font-medium text-slate-900">{incident.cellId}</span>
              <span className="hidden truncate text-slate-500 md:inline">{incident.predictedRootCause}</span>
            </Link>
          ) : (
            <p className="text-xs text-slate-500">Not a live network feed</p>
          )}
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
