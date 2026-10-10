// Black and White cats - launcher.  node server/index.mjs [--once | --report | --no-open]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import * as M from "./monitor.mjs";

const args = process.argv.slice(2), cfg = M.loadCfg();
const [maj, min] = process.versions.node.split(".").map(Number);
if (typeof fs.statfsSync !== "function") { console.error(`Node ${process.versions.node} is too old: need >= 18.15 (fs.statfsSync).`); process.exit(1); }
fs.mkdirSync(M.DATA, { recursive: true }); fs.mkdirSync(M.REPORTS, { recursive: true });
const hist = M.loadHistory(cfg);

if (args.includes("--once") || args.includes("--report")) {
  const snap = await M.cycle(cfg, hist);
  await M.refreshTopDirs(cfg);
  const full = await M.cycle(cfg, hist);
  if (args.includes("--report")) console.log(M.buildReport(full));
  console.log(`${full.host}: ${full.filesystems.length} filesystems, ${full.summary.critical} critical, ${full.summary.warning} warning  (report: ${M.writeReport(full)})`);
  process.exit(full.summary.critical ? 2 : full.summary.warning ? 1 : 0); // Nagios-style exit codes
}

// ---- collector loop (same process) ----
let lastDay = "", n = 0;
const tick = async () => {
  try {
    const snap = await M.cycle(cfg, hist); n++;
    const day = new Date().toDateString(); if (day !== lastDay) { M.writeReport(snap); lastDay = day; }
    if (n % 200 === 0) M.compactHistory(cfg, hist);
  } catch (e) { console.error("cycle error:", e.message); }
  setTimeout(tick, cfg.interval_seconds * 1000);
};
await tick();
const duLoop = async () => { try { await M.refreshTopDirs(cfg); } catch (e) { console.error("du error:", e.message); } setTimeout(duLoop, cfg.du_every_seconds * 1000); };
duLoop(); // background: first directory scan never blocks startup

// ---- HTTP ----
const DIST = path.join(M.BASE, "dist");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".map": "application/json" };
const send = (res, code, body, type = "application/json") => { const b = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body)); res.writeHead(code, { "Content-Type": type, "Content-Length": b.length, "Cache-Control": "no-store" }); res.end(b); };

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"), p = u.pathname;
  const latest = () => M.jload(path.join(M.DATA, "latest.json"), null);
  if (p === "/api/latest") { const s = latest(); return send(res, s ? 200 : 503, s || { error: "no data yet" }); }
  if (p === "/api/history") {
    const cut = Date.now() / 1000 - Number(u.searchParams.get("hours") || 24) * 3600;
    const pts = hist.filter((h) => h.ts >= cut), step = Math.max(1, Math.floor(pts.length / 300)), out = pts.filter((_, i) => i % step === 0);
    if (pts.length && out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
    return send(res, 200, { points: out });
  }
  if (p === "/api/alerts") return send(res, 200, { active: latest()?.alerts ?? [], events: M.recentEvents(Number(u.searchParams.get("hours") || 168)).slice(-200).reverse() });
  if (p === "/api/team") return send(res, 200, M.jload(path.join(M.BASE, "config", "team.json"), { members: [] }));
  if (p === "/api/report") { const s = latest(); return send(res, s ? 200 : 503, s ? { report: M.buildReport(s, cfg), ts: s.ts } : { error: "no data" }); }
  let f = path.resolve(DIST, "." + decodeURIComponent(p));
  if (!f.startsWith(DIST) || !fs.existsSync(f) || !fs.statSync(f).isFile()) f = path.join(DIST, "index.html");
  if (!fs.existsSync(f)) return send(res, 404, "dist/ missing - run: npm install && npm run build", "text/plain");
  send(res, 200, fs.readFileSync(f), MIME[path.extname(f)] || "application/octet-stream");
});
const port = Number(process.env.PORT || 8080), host = process.env.HOST || "127.0.0.1";
server.on("error", (e) => { console.error(e.code === "EADDRINUSE" ? `Port ${port} is busy. Use: PORT=8090 npm start  (Windows: set PORT=8090 && npm start)` : e.message); process.exit(1); });
server.listen(port, host, () => {
  const url = `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;
  console.log(`Black and White cats -> ${url}  (monitoring ${(latest0()).length} filesystems every ${cfg.interval_seconds}s, Ctrl+C to stop)`);
  if (!args.includes("--no-open") && (process.platform !== "linux" || process.env.DISPLAY || process.env.WAYLAND_DISPLAY))
    execFile(...(process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : [process.platform === "darwin" ? "open" : "xdg-open", [url]]), () => {});
});
function latest0() { return M.jload(path.join(M.DATA, "latest.json"), { filesystems: [] }).filesystems; }
