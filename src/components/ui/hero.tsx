import { Activity, ArrowRight, Cat, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Snapshot } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";

const col = (l: string) => (l === "critical" ? "#ef4444" : l === "warning" ? "#f59e0b" : "#fafafa");

function Ring({ pct, level }: { pct: number; level: string }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90"><circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={col(level)} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)} style={{ transition: "stroke-dashoffset 1s" }} /></svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  );
}

/** Landing hero: glow title, live status pill, CTAs and a window-frame preview fed by real filesystem data. */
export function Hero({ snap, offline }: { snap: Snapshot | null; offline: boolean }) {
  const status = offline ? "collector offline — run npm start" : !snap ? "connecting…" : snap.summary.critical ? `${snap.summary.critical} critical alert(s)` : snap.summary.warning ? `${snap.summary.warning} warning(s)` : `live · ${snap.host} · all clear`;
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-24 sm:pt-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
        <a href="#/dashboard" className="group mb-8 inline-flex animate-fade-up items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-xs backdrop-blur-md transition-colors hover:border-white/40">
          <span className="size-2 animate-dot rounded-full" style={{ background: offline ? "#ef4444" : snap?.summary.critical ? "#ef4444" : snap?.summary.warning ? "#f59e0b" : "#34d399" }} />
          {status}<ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </a>
        <Cat className="mb-6 size-10 animate-fade-up text-white/80" />
        <h1 className="font-display animate-fade-up bg-gradient-to-b from-white to-white/40 bg-clip-text text-5xl font-medium text-transparent sm:text-7xl md:text-8xl">Black and White cats</h1>
        <p className="mt-6 max-w-xl animate-fade-up text-lg text-muted-foreground sm:text-xl">Linux Storage Monitoring System</p>
        <div className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild><a href="#/dashboard"><Activity className="mr-2 size-4" />Dashboard</a></Button>
          <Button size="lg" variant="secondary" asChild><a href="#/faq"><Github className="mr-2 size-4" />FAQ &amp; team</a></Button>
        </div>

        <div className="mt-16 w-full animate-fade-up rounded-2xl border bg-card/50 p-2 shadow-[0_0_80px_-20px_rgba(255,255,255,.25)] backdrop-blur-xl [perspective:1200px]">
          <div className="flex items-center gap-1.5 px-3 py-2"><span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" />
            <span className="ml-3 text-xs text-muted-foreground">{snap ? `${snap.host} · ${snap.platform} · ${fmtBytes(snap.summary.used)} of ${fmtBytes(snap.summary.total)} used` : "waiting for the first scan"}</span></div>
          <div className="grid gap-3 rounded-xl bg-black/40 p-4 sm:grid-cols-3">
            {(snap?.filesystems ?? []).slice(0, 3).map((f) => (
              <div key={f.mount} className="flex items-center gap-4 rounded-lg border bg-card/60 p-4 text-left">
                <Ring pct={f.use_pct} level={f.status} />
                <div className="min-w-0"><p className="truncate font-medium">{f.mount}</p><p className="text-xs text-muted-foreground">{fmtBytes(f.avail)} free</p>
                  <p className="text-xs text-muted-foreground">{f.inode_pct === null ? "inodes n/a" : `inodes ${f.inode_pct.toFixed(1)}%`}</p></div>
              </div>
            ))}
            {!snap && <p className="col-span-full py-8 text-sm text-muted-foreground">{offline ? "No data — start the collector with npm start." : "Loading live data…"}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
