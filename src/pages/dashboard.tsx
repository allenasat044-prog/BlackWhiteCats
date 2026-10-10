import { useState } from "react";
import { Activity, AlertTriangle, Database, FolderTree, HardDrive, Hash, LineChart, TrendingUp, Clock } from "lucide-react";
import { FeatureCard } from "@/components/ui/feature-card";
import { usePoll, type FS, type HistoryResp, type Snapshot } from "@/lib/api";
import { cn, fmtBytes, fmtDuration } from "@/lib/utils";

const col = (l: string) => (l === "critical" ? "#ef4444" : l === "warning" ? "#f59e0b" : "#fafafa");

function Gauge({ pct, level }: { pct: number; level: string }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={col(level)} strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)} style={{ transition: "stroke-dashoffset 1s ease, stroke .5s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-semibold tabular-nums">{pct.toFixed(1)}%</span><span className="text-[10px] uppercase text-muted-foreground">used</span></div>
    </div>
  );
}

function Bar({ pct, level }: { pct: number; level: string }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.max(pct, 0.5)}%`, background: col(level), transition: "width 1s ease" }} /></div>;
}

const inodeLevel = (f: FS, t: Snapshot["thresholds"]) => (f.inode_pct === null ? "ok" : f.inode_pct >= t.inode_crit_pct ? "critical" : f.inode_pct >= t.inode_warn_pct ? "warning" : "ok");

function Stat({ icon, label, value, sub, d }: { icon: typeof Database; label: string; value: string; sub: string; d: number }) {
  return (
    <FeatureCard icon={icon} title={label} description={sub} delay={d}><div className="text-3xl font-semibold tabular-nums">{value}</div></FeatureCard>
  );
}

function FsCard({ f, t, d }: { f: FS; t: Snapshot["thresholds"]; d: number }) {
  const g = f.growth, il = inodeLevel(f, t);
  return (
    <FeatureCard icon={HardDrive} title={f.mount} description={`${f.device} · ${f.fstype}`} delay={d}>
      <div className="flex items-center gap-5">
        <Gauge pct={f.use_pct} level={f.status === "ok" ? "ok" : f.status} />
        <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Total</dt><dd className="text-right tabular-nums">{fmtBytes(f.total)}</dd>
          <dt className="text-muted-foreground">Used</dt><dd className="text-right tabular-nums">{fmtBytes(f.used)}</dd>
          <dt className="text-muted-foreground">Free</dt><dd className="text-right tabular-nums">{fmtBytes(f.avail)}</dd>
          <dt className="text-muted-foreground">Status</dt><dd className="text-right font-medium uppercase" style={{ color: col(f.status) }}>{f.status}</dd>
        </dl>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs"><span className="flex items-center gap-1 text-muted-foreground"><Hash className="size-3" />Inodes</span>
          <span className="tabular-nums">{f.inode_pct === null ? "not reported by this filesystem" : `${f.inodes_used.toLocaleString()} / ${f.inodes_total.toLocaleString()} (${f.inode_pct.toFixed(2)}%)`}</span></div>
        {f.inode_pct !== null && <Bar pct={f.inode_pct} level={il} />}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border bg-black/20 p-2.5"><div className="mb-1 flex items-center gap-1 text-muted-foreground"><TrendingUp className="size-3" />Growth / day</div>
          <div className="text-sm font-medium tabular-nums">{g.bytes_per_day === null ? `collecting (${g.samples} samples)` : `${g.bytes_per_day >= 0 ? "+" : ""}${fmtBytes(g.bytes_per_day)}`}</div></div>
        <div className="rounded-lg border bg-black/20 p-2.5"><div className="mb-1 flex items-center gap-1 text-muted-foreground"><Clock className="size-3" />Full in</div>
          <div className="text-sm font-medium tabular-nums">{g.bytes_per_day === null ? "collecting" : g.days_to_full === null ? "not growing" : `${g.days_to_full.toFixed(1)} days`}</div></div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground"><FolderTree className="size-3" />Largest directories</div>
        {f.top_dirs?.length ? (
          <ul className="space-y-1.5">{f.top_dirs.slice(0, 5).map((x) => (
            <li key={x.path} className="text-xs"><div className="flex justify-between gap-2"><span className="truncate font-mono">{x.path}</span><span className="shrink-0 tabular-nums text-muted-foreground">{fmtBytes(x.bytes)}</span></div>
              <div className="mt-0.5 h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-white/70" style={{ width: `${Math.min(100, (x.bytes / f.top_dirs![0].bytes) * 100)}%`, transition: "width 1s" }} /></div></li>
          ))}</ul>
        ) : <p className="text-xs text-muted-foreground">No sub-directories reported (empty or unreadable).</p>}
      </div>
    </FeatureCard>
  );
}

function Trend({ snap }: { snap: Snapshot }) {
  const [mount, setMount] = useState<string>(snap.filesystems[0]?.mount ?? "/");
  const [hours, setHours] = useState(1);
  const { data } = usePoll<HistoryResp>(`/api/history?hours=${hours}`, 15000);
  const pts = (data?.points ?? []).filter((p) => p.m[mount]).map((p) => ({ t: p.ts, y: p.m[mount][2] }));
  const W = 600, H = 140;
  let body = <p className="py-10 text-center text-sm text-muted-foreground">Need at least 2 samples — the collector samples every {snap.interval}s.</p>;
  if (pts.length >= 2) {
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const ys = pts.map((p) => p.y), lo = Math.min(...ys), hi = Math.max(...ys), pad = Math.max((hi - lo) * 0.2, 0.05);
    const x = (t: number) => ((t - t0) / (t1 - t0 || 1)) * W, y = (v: number) => H - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * H;
    const line = pts.map((p) => `${x(p.t).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
    body = (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none">
          <defs><linearGradient id="ar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
          <polygon points={`0,${H} ${line} ${W},${H}`} fill="url(#ar)" /><polyline points={line} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground tabular-nums"><span>{new Date(t0 * 1000).toLocaleTimeString()}</span><span>min {lo.toFixed(2)}% · max {hi.toFixed(2)}% · {pts.length} samples</span><span>{new Date(t1 * 1000).toLocaleTimeString()}</span></div>
      </div>
    );
  }
  return (
    <FeatureCard icon={LineChart} title="Usage trend" description="Recorded samples from the collector" className="lg:col-span-2" delay={200}>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <select value={mount} onChange={(e) => setMount(e.target.value)} className="rounded-md border bg-secondary px-2 py-1">{snap.filesystems.map((f) => <option key={f.mount}>{f.mount}</option>)}</select>
        {[1, 6, 24, 168].map((h) => <button key={h} onClick={() => setHours(h)} className={cn("rounded-md border px-2 py-1", hours === h ? "bg-primary text-primary-foreground" : "bg-secondary")}>{h >= 24 ? `${h / 24}d` : `${h}h`}</button>)}
      </div>
      {body}
    </FeatureCard>
  );
}

export default function Dashboard({ snap, offline }: { snap: Snapshot | null; offline: boolean }) {
  if (!snap) return <div className="container pt-32 text-center text-muted-foreground">{offline ? "Collector offline — start it with: npm start" : "Loading live data…"}</div>;
  const s = snap.summary;
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-24">
      <div className="mb-6 animate-fade-up"><h1 className="font-display text-4xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">{snap.host} · last scan {new Date(snap.ts * 1000).toLocaleTimeString()} · refreshes every 5s, samples every {snap.interval}s · uptime {fmtDuration(snap.uptime_seconds)}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Database} label="Total capacity" value={fmtBytes(s.total)} sub={`${snap.filesystems.length} filesystems`} d={0} />
        <Stat icon={HardDrive} label="Used" value={fmtBytes(s.used)} sub={`${((s.used / (s.used + s.avail)) * 100).toFixed(1)}% of usable`} d={60} />
        <Stat icon={Activity} label="Available" value={fmtBytes(s.avail)} sub="free to non-root users" d={120} />
        <Stat icon={AlertTriangle} label="Active alerts" value={String(s.critical + s.warning)} sub={`${s.critical} critical · ${s.warning} warning`} d={180} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {snap.filesystems.map((f, i) => <FsCard key={f.mount} f={f} t={snap.thresholds} d={240 + i * 60} />)}
        <Trend snap={snap} />
        <FeatureCard icon={AlertTriangle} title="Current alerts" description={`warn ${snap.thresholds.warn_pct}% · crit ${snap.thresholds.crit_pct}%`} delay={260}>
          {snap.alerts.length === 0 ? <p className="text-sm text-muted-foreground">Everything is within thresholds.</p> : (
            <ul className="space-y-2">{snap.alerts.map((a) => <li key={a.key} className="rounded-lg border p-2 text-xs" style={{ borderColor: col(a.level) + "66" }}><span className="font-semibold uppercase" style={{ color: col(a.level) }}>{a.level}</span> {a.message}</li>)}</ul>
          )}
        </FeatureCard>
      </div>
    </div>
  );
}
