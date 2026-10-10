"use client";

import { Award, Cat, Clock, Cpu, HardDrive, Server, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Snapshot } from "@/lib/api";
import { fmtBytes, fmtDuration } from "@/lib/utils";

/** Landing hero (call-to-action-01). @aliimam icons/logos replaced with lucide-react; ratings/logos replaced by live host data. */
const Cta1 = ({ snap, offline }: { snap: Snapshot | null; offline: boolean }) => {
  const badges = [
    { icon: Award, text: snap ? `${snap.filesystems.length} filesystems` : "…" },
    { icon: Cat, text: snap ? `${fmtBytes(snap.summary.used)} used` : "…" },
    { icon: ShieldCheck, text: snap ? (snap.alerts.length ? `${snap.alerts.length} active alerts` : "no active alerts") : "…" },
  ];
  const facts = snap
    ? [
        { icon: Server, text: snap.host }, { icon: Cpu, text: `${snap.platform} · ${snap.kernel}` },
        { icon: Clock, text: `up ${fmtDuration(snap.uptime_seconds)}` }, { icon: HardDrive, text: `${fmtBytes(snap.summary.total)} total` },
        { icon: Clock, text: `scan ${new Date(snap.ts * 1000).toLocaleTimeString()}` }, { icon: Clock, text: `every ${snap.interval}s` },
      ]
    : [];
  return (
    <section className="relative py-32">
      <div className="container">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 border-x [mask-image:linear-gradient(black,transparent)]"></div>
          <div className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2">
            <svg
              className="pointer-events-none absolute inset-0 text-black/20 [mask-composite:intersect] [mask-image:linear-gradient(black,transparent),radial-gradient(black,transparent)] dark:text-white/20"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern id="grid-pattern" x="-1" y="-1" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="transparent" stroke="currentColor" strokeWidth="1"></path>
                </pattern>
              </defs>
              <rect fill="url(#grid-pattern)" width="100%" height="100%"></rect>
            </svg>
          </div>
        </div>
        <div className="relative flex flex-col items-center px-4 pb-32 pt-24 text-center">
          <div className="mb-10 flex flex-wrap items-center justify-center gap-8">
            {badges.map(({ icon: Icon, text }) => (
              <div key={text} className="group flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary"><Icon className="h-3 w-auto" /></div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          <h1 className="font-display max-w-3xl text-balance text-5xl font-medium sm:text-7xl">Black and White cats</h1>
          <p className="mt-6 max-w-[560px] text-lg font-medium text-muted-foreground sm:text-xl">Linux Storage Monitoring System</p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Button size="lg" asChild><a href="#/dashboard">Dashboard</a></Button>
            <Button size="lg" variant="secondary" asChild><a href="#/alerts">View alerts</a></Button>
          </div>

          <div className="mt-14 grid grid-cols-2 items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground sm:grid-cols-3">
            {offline && <span className="col-span-full text-red-400">Collector offline — start it with: npm start</span>}
            {facts.map(({ icon: Icon, text }, i) => (
              <span key={i} className="flex items-center justify-center gap-2"><Icon className="size-4" />{text}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Cta1 };
