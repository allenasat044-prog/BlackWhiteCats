// Cross-platform (Linux / macOS / Windows) storage collector. Node >= 18.15, zero dependencies.
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
export const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA = path.join(BASE, "data");
export const REPORTS = path.join(BASE, "reports");
const PLAT = process.platform;
const LEVELS = { ok: 0, warning: 1, critical: 2 };
const PSEUDO = new Set(["proc","sysfs","devtmpfs","devpts","cgroup","cgroup2","pstore","bpf","debugfs","tracefs","securityfs","configfs","fusectl","mqueue","hugetlbfs","autofs","binfmt_misc","rpc_pipefs","nsfs","efivarfs","squashfs","ramfs","fuse.gvfsd-fuse","fuse.portal","selinuxfs","overlay_unused"]);
const MAC_SKIP = ["/System/Volumes/VM", "/System/Volumes/Preboot", "/System/Volumes/Update", "/System/Volumes/xarts", "/System/Volumes/iSCSI", "/System/Volumes/Hardware", "/private/var/vm", "/Library/Developer"];

const DEFAULTS = { interval_seconds: 30, warn_pct: 80, crit_pct: 90, inode_warn_pct: 80, inode_crit_pct: 90, days_to_full_warn: 14, days_to_full_crit: 3,
  history_days: 30, growth_window_hours: 24, min_samples: 3, min_span_seconds: 60, du_every_seconds: 600, du_timeout_seconds: 90, top_dirs: 8,
  include_tmpfs: false, exclude_mount_prefixes: [], alerts: { reminder_minutes: 60, log_file: true, syslog: true, webhook: { enabled: false, url: "" }, command: { enabled: false, run: "" } } };

export function loadCfg() {
  const u = jload(path.join(BASE, "config", "config.json"), {});
  return { ...DEFAULTS, ...u, alerts: { ...DEFAULTS.alerts, ...(u.alerts || {}) } };
}
export function jload(p, def) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return def; } }
export function atomic(p, obj) { const t = p + ".tmp"; fs.writeFileSync(t, JSON.stringify(obj)); fs.renameSync(t, p); }

export function fmt(n) {
  if (n === null || n === undefined) return "n/a";
  const u = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]; let v = Math.abs(n), i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${n < 0 ? "-" : ""}${i ? v.toFixed(2) : v.toFixed(0)} ${u[i]}`;
}

// ---------- mount discovery ----------
export function parseProcMounts(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const p = line.split(" "); if (p.length < 3) continue;
    out.push({ device: p[0], mount: p[1].replace(/\\040/g, " "), fstype: p[2] });
  }
  return out;
}
export function parseMacMount(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^(.+?) on (.+?) \(([^,)]+)(?:, ([^)]*))?\)\s*$/);
    if (m) out.push({ device: m[1], mount: m[2], fstype: m[3] });
  }
  return out;
}
async function listMounts(cfg) {
  if (PLAT === "linux") {
    const by = new Map();
    for (const m of parseProcMounts(fs.readFileSync("/proc/mounts", "utf8"))) {
      if (PSEUDO.has(m.fstype) || (m.fstype === "tmpfs" && !cfg.include_tmpfs)) continue;
      if (cfg.exclude_mount_prefixes.some((x) => m.mount === x || m.mount.startsWith(x.replace(/\/$/, "") + "/"))) continue;
      by.set(m.mount, m);
    }
    return [...by.values()].sort((a, b) => a.mount.localeCompare(b.mount));
  }
  if (PLAT === "darwin") {
    const { stdout } = await run("mount");
    const all = parseMacMount(stdout).filter((m) => (m.device.startsWith("/dev/") || ["nfs", "smbfs", "afpfs"].includes(m.fstype)) && !MAC_SKIP.some((s) => m.mount.startsWith(s)));
    const hasData = all.some((m) => m.mount === "/System/Volumes/Data");
    return all.filter((m) => !(hasData && m.mount === "/")); // sealed system volume duplicates the container numbers
  }
  if (PLAT === "win32") {
    const types = {};
    try {
      const { stdout } = await run("powershell", ["-NoProfile", "-NonInteractive", "-Command", "Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,FileSystem,DriveType | ConvertTo-Json -Compress"], { timeout: 15000 });
      const j = JSON.parse(stdout); for (const d of Array.isArray(j) ? j : [j]) types[d.DeviceID] = d;
    } catch { /* PowerShell optional: fall back to probing drive letters */ }
    const out = [];
    for (let c = 65; c <= 90; c++) {
      const L = String.fromCharCode(c), root = `${L}:\\`;
      if (types[`${L}:`]?.DriveType === 5) continue; // optical
      if (Object.keys(types).length ? types[`${L}:`] : fs.existsSync(root)) out.push({ device: `${L}:`, mount: root, fstype: types[`${L}:`]?.FileSystem || "disk" });
    }
    return out;
  }
  return [{ device: "root", mount: "/", fstype: "unknown" }];
}

function readFs(m) {
  let st; try { st = fs.statfsSync(m.mount); } catch { return null; }
  if (!st.blocks) return null;
  const bs = st.bsize, total = st.blocks * bs, used = (st.blocks - st.bfree) * bs, avail = st.bavail * bs;
  const it = st.files, ifr = st.ffree, iu = it - ifr;
  let dev = null; if (PLAT !== "win32") { try { dev = fs.statSync(m.mount).dev; } catch { return null; } }
  return { _dev: dev, mount: m.mount, device: m.device, fstype: m.fstype, total, used, avail,
    use_pct: used + avail ? +(used / (used + avail) * 100).toFixed(2) : 0,
    inodes_total: it, inodes_used: it > 0 ? iu : 0, inodes_free: it > 0 ? ifr : 0, inode_pct: it > 0 ? +(iu / it * 100).toFixed(2) : null };
}

// ---------- largest directories ----------
async function jsSize(root, deadline, dev) {
  let total = 0, partial = false; const stack = [root];
  while (stack.length) {
    if (Date.now() > deadline) { partial = true; break; }
    const d = stack.pop(); let ents; try { ents = await fsp.readdir(d, { withFileTypes: true }); } catch { continue; }
    await Promise.all(ents.map(async (e) => {
      const f = path.join(d, e.name);
      try {
        const s = await fsp.lstat(f); if (s.isSymbolicLink()) return;
        if (s.isDirectory()) { if (dev === null || s.dev === dev) stack.push(f); } else total += s.blocks ? s.blocks * 512 : s.size;
      } catch { /* unreadable */ }
    }));
  }
  return { bytes: total, partial };
}
export async function topDirs(mount, n, timeoutMs) {
  if (PLAT !== "win32") {
    try {
      let out; try { out = (await run("nice", ["-n", "19", "du", "-x", "-d", "1", "-k", mount], { timeout: timeoutMs, maxBuffer: 1 << 26 })).stdout; }
      catch (e) { if (e.killed || !e.stdout) throw e; out = e.stdout; } // du exits non-zero on permission errors but still prints sizes
      const rows = [];
      for (const l of out.split("\n")) { const t = l.indexOf("\t"); if (t < 0) continue; const p = l.slice(t + 1); if (p.replace(/\/$/, "") !== mount.replace(/\/$/, "")) rows.push({ path: p, bytes: parseInt(l.slice(0, t), 10) * 1024 }); }
      return rows.sort((a, b) => b.bytes - a.bytes).slice(0, n);
    } catch { /* fall through to JS walker */ }
  }
  const deadline = Date.now() + timeoutMs; let dev = null;
  if (PLAT !== "win32") try { dev = fs.statSync(mount).dev; } catch {}
  const rows = []; let ents = [];
  try { ents = await fsp.readdir(mount, { withFileTypes: true }); } catch { return null; }
  for (const e of ents) {
    const f = path.join(mount, e.name);
    try {
      const s = await fsp.lstat(f); if (s.isSymbolicLink()) continue;
      if (s.isDirectory()) { if (dev !== null && s.dev !== dev) continue; const r = await jsSize(f, deadline, dev); rows.push({ path: f, bytes: r.bytes, partial: r.partial }); }
      else rows.push({ path: f, bytes: s.blocks ? s.blocks * 512 : s.size });
    } catch {}
  }
  return rows.sort((a, b) => b.bytes - a.bytes).slice(0, n);
}
export async function refreshTopDirs(cfg) {
  const snap = jload(path.join(DATA, "latest.json"), null); if (!snap) return;
  const cache = jload(path.join(DATA, "topdirs.json"), {});
  for (const f of snap.filesystems) { const d = await topDirs(f.mount, cfg.top_dirs, cfg.du_timeout_seconds * 1000); if (d) { cache[f.mount] = { ts: Date.now() / 1000, dirs: d }; atomic(path.join(DATA, "topdirs.json"), cache); } }
}

// ---------- growth + alerts ----------
function slope(pts) {
  const n = pts.length, mt = pts.reduce((a, p) => a + p[0], 0) / n, mv = pts.reduce((a, p) => a + p[1], 0) / n;
  let num = 0, den = 0; for (const [t, v] of pts) { num += (t - mt) * (v - mv); den += (t - mt) ** 2; }
  return den === 0 ? null : num / den;
}
function growth(hist, mp, now, avail, cfg) {
  const cut = now - cfg.growth_window_hours * 3600;
  const pts = hist.filter((h) => h.ts >= cut && h.m[mp]).map((h) => [h.ts, h.m[mp]]);
  const g = { bytes_per_day: null, inodes_per_day: null, days_to_full: null, samples: pts.length, span_hours: 0 };
  if (pts.length < cfg.min_samples || pts[pts.length - 1][0] - pts[0][0] < cfg.min_span_seconds) return g;
  const t0 = pts[0][0]; g.span_hours = +((pts[pts.length - 1][0] - t0) / 3600).toFixed(3);
  const su = slope(pts.map(([t, v]) => [t - t0, v[0]])), si = slope(pts.map(([t, v]) => [t - t0, v[1]]));
  if (su !== null) { g.bytes_per_day = su * 86400; if (su > 0) g.days_to_full = avail / su / 86400; }
  if (si !== null) g.inodes_per_day = si * 86400;
  return g;
}
function evaluate(f, cfg) {
  const A = [], add = (kind, level, message) => A.push({ key: `${f.mount}:${kind}`, mount: f.mount, kind, level, message });
  const p = f.use_pct;
  if (p >= cfg.crit_pct) add("space", "critical", `${f.mount} space ${p.toFixed(1)}% used (>= ${cfg.crit_pct}%), ${fmt(f.avail)} free`);
  else if (p >= cfg.warn_pct) add("space", "warning", `${f.mount} space ${p.toFixed(1)}% used (>= ${cfg.warn_pct}%), ${fmt(f.avail)} free`);
  const ip = f.inode_pct;
  if (ip !== null) {
    if (ip >= cfg.inode_crit_pct) add("inode", "critical", `${f.mount} inodes ${ip.toFixed(1)}% used (>= ${cfg.inode_crit_pct}%), ${f.inodes_free} free`);
    else if (ip >= cfg.inode_warn_pct) add("inode", "warning", `${f.mount} inodes ${ip.toFixed(1)}% used (>= ${cfg.inode_warn_pct}%), ${f.inodes_free} free`);
  }
  const d = f.growth.days_to_full;
  if (d !== null) {
    const m = `${f.mount} projected full in ${d.toFixed(1)} days at ${fmt(f.growth.bytes_per_day)}/day`;
    if (d <= cfg.days_to_full_crit) add("growth", "critical", m); else if (d <= cfg.days_to_full_warn) add("growth", "warning", m);
  }
  return A;
}
function dispatch(ev, cfg) {
  const a = cfg.alerts, line = `[${ev.state}] ${ev.level.toUpperCase()} ${os.hostname()}: ${ev.message}`;
  if (a.log_file) fs.appendFileSync(path.join(DATA, "alerts.log"), `${new Date(ev.ts * 1000).toISOString()} ${line}\n`);
  if (a.syslog && PLAT !== "win32") execFile("logger", ["-t", "storage-monitor", "-p", ev.level === "critical" ? "user.crit" : "user.warning", line], () => {});
  if (a.webhook?.enabled && a.webhook.url) fetch(a.webhook.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: line, content: line }), signal: AbortSignal.timeout(10000) }).catch((e) => console.error("webhook failed:", e.message));
  if (a.command?.enabled && a.command.run) require_exec(a.command.run, { ALERT_STATE: ev.state, ALERT_LEVEL: ev.level, ALERT_MOUNT: ev.mount, ALERT_MESSAGE: ev.message });
}
import { exec } from "node:child_process";
function require_exec(cmd, env) { exec(cmd, { env: { ...process.env, ...env }, timeout: 15000 }, (e) => e && console.error("alert command failed:", e.message)); }

function processAlerts(active, state, now, cfg) {
  const remind = cfg.alerts.reminder_minutes * 60, keys = new Set(active.map((a) => a.key)), events = [];
  for (const a of active) {
    const s = state[a.key];
    if (!s || s.level !== a.level || (a.level === "critical" && now - s.last_sent >= remind)) {
      events.push({ ...a, ts: now, state: "FIRING" });
      state[a.key] = { level: a.level, since: s ? s.since : now, last_sent: now, message: a.message, mount: a.mount, kind: a.kind };
    }
  }
  for (const k of Object.keys(state)) if (!keys.has(k)) {
    const s = state[k]; delete state[k];
    events.push({ key: k, mount: s.mount, kind: s.kind, level: s.level, ts: now, state: "RESOLVED", message: `${s.mount} ${s.kind} back to normal (was ${s.level})` });
  }
  for (const ev of events) { dispatch(ev, cfg); fs.appendFileSync(path.join(DATA, "alerts.jsonl"), JSON.stringify(ev) + "\n"); }
  for (const a of active) a.since = state[a.key].since;
}

export function loadHistory(cfg) {
  const cut = Date.now() / 1000 - cfg.history_days * 86400, out = [];
  try { for (const l of fs.readFileSync(path.join(DATA, "history.jsonl"), "utf8").split("\n")) { if (!l) continue; try { const h = JSON.parse(l); if (h.ts >= cut) out.push(h); } catch {} } } catch {}
  return out;
}
export function compactHistory(cfg, hist) {
  const fresh = loadHistory(cfg); hist.splice(0, hist.length, ...fresh);
  fs.writeFileSync(path.join(DATA, "history.jsonl"), fresh.map((h) => JSON.stringify(h)).join("\n") + "\n");
}

export async function cycle(cfg, hist) {
  fs.mkdirSync(DATA, { recursive: true }); fs.mkdirSync(REPORTS, { recursive: true });
  const now = Date.now() / 1000, seen = new Set(), fss = [];
  for (const m of await listMounts(cfg)) {
    const f = readFs(m); if (!f) continue;
    if (f._dev !== null) { if (seen.has(f._dev)) continue; seen.add(f._dev); } // bind-mount duplicates
    delete f._dev; fss.push(f);
  }
  const cache = jload(path.join(DATA, "topdirs.json"), {});
  hist.push({ ts: now, m: Object.fromEntries(fss.map((f) => [f.mount, [f.used, f.inodes_used, f.use_pct]])) });
  fs.appendFileSync(path.join(DATA, "history.jsonl"), JSON.stringify(hist[hist.length - 1]) + "\n");
  const active = [];
  for (const f of fss) {
    f.top_dirs = cache[f.mount]?.dirs ?? null; f.top_dirs_ts = cache[f.mount]?.ts ?? null;
    f.growth = growth(hist, f.mount, now, f.avail, cfg);
    const al = evaluate(f, cfg); active.push(...al);
    f.status = al.reduce((m, a) => (LEVELS[a.level] > LEVELS[m] ? a.level : m), "ok");
  }
  const sp = path.join(DATA, "alert_state.json"), state = jload(sp, {});
  processAlerts(active, state, now, cfg); atomic(sp, state);
  const snap = { ts: now, host: os.hostname(), kernel: `${os.type()} ${os.release()}`, platform: `${PLAT} ${os.arch()}`, uptime_seconds: os.uptime(), interval: cfg.interval_seconds,
    thresholds: Object.fromEntries(["warn_pct","crit_pct","inode_warn_pct","inode_crit_pct","days_to_full_warn","days_to_full_crit"].map((k) => [k, cfg[k]])),
    filesystems: fss, alerts: active,
    summary: { total: sum(fss, "total"), used: sum(fss, "used"), avail: sum(fss, "avail"), critical: active.filter((a) => a.level === "critical").length, warning: active.filter((a) => a.level === "warning").length } };
  atomic(path.join(DATA, "latest.json"), snap);
  return snap;
}
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);

// ---------- reports ----------
export function recentEvents(hours = 24) {
  const cut = Date.now() / 1000 - hours * 3600, out = [];
  try { for (const l of fs.readFileSync(path.join(DATA, "alerts.jsonl"), "utf8").split("\n")) { if (!l) continue; try { const e = JSON.parse(l); if (e.ts >= cut) out.push(e); } catch {} } } catch {}
  return out;
}
export function buildReport(snap, cfg = loadCfg()) {
  const pad = (s, n) => String(s).padEnd(n), lp = (s, n) => String(s).padStart(n), bar = "-".repeat(78);
  const L = ["=".repeat(78), ` STORAGE REPORT  ${snap.host}   ${new Date(snap.ts * 1000).toLocaleString()}`, ` ${snap.platform}  ${snap.kernel}   uptime ${(snap.uptime_seconds / 86400).toFixed(2)} days`, "=".repeat(78), "",
    pad("MOUNT", 22) + pad("TYPE", 8) + lp("SIZE", 11) + lp("USED", 11) + lp("FREE", 11) + lp("USE%", 7) + lp("INODE%", 8) + "  STATUS", bar];
  for (const f of snap.filesystems) L.push(pad(f.mount.slice(0, 21), 22) + pad(f.fstype.slice(0, 7), 8) + lp(fmt(f.total), 11) + lp(fmt(f.used), 11) + lp(fmt(f.avail), 11) + lp(f.use_pct.toFixed(1), 7) + lp(f.inode_pct === null ? "n/a" : f.inode_pct.toFixed(1), 8) + "  " + f.status.toUpperCase());
  L.push("", `GROWTH (least-squares over last ${cfg.growth_window_hours}h of samples)`, bar);
  for (const f of snap.filesystems) { const g = f.growth;
    L.push(g.bytes_per_day === null ? `${pad(f.mount, 22)} insufficient samples (${g.samples}) - collector needs more time`
      : `${pad(f.mount, 22)} ${fmt(g.bytes_per_day)}/day, ${Math.round(g.inodes_per_day)} inodes/day, ${g.days_to_full ? `full in ${g.days_to_full.toFixed(1)} days` : "not growing"}`); }
  L.push("", "LARGEST DIRECTORIES", bar);
  for (const f of snap.filesystems) { L.push(`${f.mount}:`); for (const d of (f.top_dirs || []).slice(0, 5)) L.push(`   ${lp(fmt(d.bytes), 11)}  ${d.path}`); }
  L.push("", "ACTIVE ALERTS", bar, ...(snap.alerts.length ? snap.alerts.map((a) => ` [${a.level.toUpperCase()}] ${a.message}`) : [" none"]));
  const ev = recentEvents(24);
  L.push("", "ALERT EVENTS (24h)", bar, ...(ev.length ? ev.slice(-30).map((e) => ` ${new Date(e.ts * 1000).toLocaleTimeString()} ${pad(e.state, 9)}${e.message}`) : [" none"]));
  return L.join("\n") + "\n";
}
export function writeReport(snap) {
  const p = path.join(REPORTS, `storage-report-${new Date().toISOString().slice(0, 10)}.txt`);
  fs.writeFileSync(p, buildReport(snap)); return p;
}
