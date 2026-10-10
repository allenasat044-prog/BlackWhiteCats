import { useEffect, useState } from "react";

export type Level = "ok" | "warning" | "critical";
export interface Growth { bytes_per_day: number | null; inodes_per_day: number | null; days_to_full: number | null; samples: number; span_hours: number }
export interface FS {
  mount: string; device: string; fstype: string; total: number; used: number; avail: number; use_pct: number;
  inodes_total: number; inodes_used: number; inodes_free: number; inode_pct: number | null;
  growth: Growth; top_dirs: { path: string; bytes: number }[] | null; top_dirs_ts: number | null; status: Level;
}
export interface Alert { key: string; mount: string; kind: string; level: "warning" | "critical"; message: string; since?: number; ts?: number; state?: string }
export interface Snapshot {
  ts: number; host: string; kernel: string; platform: string; uptime_seconds: number; interval: number;
  thresholds: Record<string, number>; filesystems: FS[]; alerts: Alert[];
  summary: { total: number; used: number; avail: number; critical: number; warning: number };
}
export interface HistoryResp { points: { ts: number; m: Record<string, [number, number, number]> }[] }

export function usePoll<T>(url: string, ms: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const go = async () => {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const j = (await r.json()) as T;
        if (alive) { setData(j); setError(null); }
      } catch (e) { if (alive) setError(String(e)); }
    };
    go();
    const id = setInterval(go, ms);
    return () => { alive = false; clearInterval(id); };
  }, [url, ms]);
  return { data, error };
}

export interface Member { name: string; role: string; github: string }
