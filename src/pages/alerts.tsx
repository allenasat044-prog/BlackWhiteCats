import { Bell, CheckCircle2, History } from "lucide-react";
import { FeatureCard } from "@/components/ui/feature-card";
import { usePoll, type Alert } from "@/lib/api";

const col = (l: string) => (l === "critical" ? "#ef4444" : "#f59e0b");

export default function Alerts() {
  const { data, error } = usePoll<{ active: Alert[]; events: Alert[] }>("/api/alerts?hours=168", 5000);
  if (!data) return <div className="container pt-32 text-center text-muted-foreground">{error ?? "Loading…"}</div>;
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-24">
      <h1 className="font-display mb-6 animate-fade-up text-4xl">Alerts</h1>
      <div className="grid gap-4">
        <FeatureCard icon={Bell} title="Active" description="Delivered to log file, syslog, and email/webhook when enabled in config/config.json">
          {data.active.length === 0 ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="size-4" />No active alerts.</p> :
            <ul className="space-y-2">{data.active.map((a) => <li key={a.key} className="rounded-lg border p-3 text-sm" style={{ borderColor: col(a.level) + "66" }}>
              <span className="mr-2 font-semibold uppercase" style={{ color: col(a.level) }}>{a.level}</span>{a.message}
              {a.since && <span className="ml-2 text-xs text-muted-foreground">since {new Date(a.since * 1000).toLocaleString()}</span>}</li>)}</ul>}
        </FeatureCard>
        <FeatureCard icon={History} title="Event history" description="Last 7 days (data/alerts.jsonl)" delay={100}>
          {data.events.length === 0 ? <p className="text-sm text-muted-foreground">No alert events recorded yet.</p> :
            <ul className="divide-y text-sm">{data.events.map((e, i) => <li key={i} className="flex gap-3 py-2">
              <span className="w-40 shrink-0 text-xs tabular-nums text-muted-foreground">{new Date((e.ts ?? 0) * 1000).toLocaleString()}</span>
              <span className="w-20 shrink-0 text-xs font-semibold" style={{ color: e.state === "RESOLVED" ? "#34d399" : col(e.level) }}>{e.state}</span><span>{e.message}</span></li>)}</ul>}
        </FeatureCard>
      </div>
    </div>
  );
}
