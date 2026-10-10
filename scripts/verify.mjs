// Compares collector numbers with the OS's own df (Linux/macOS). Windows: compare with `Get-PSDrive -PSProvider FileSystem`.
import { execFileSync } from "node:child_process";
import fs from "node:fs"; import path from "node:path";
import { DATA } from "../server/monitor.mjs";
if (process.platform === "win32") { console.log("Windows: run  Get-PSDrive -PSProvider FileSystem  and compare Used/Free with the dashboard."); process.exit(0); }
const snap = JSON.parse(fs.readFileSync(path.join(DATA, "latest.json"), "utf8"));
const rows = {}; for (const l of execFileSync("df", ["-kP"], { encoding: "utf8" }).split("\n").slice(1)) { const p = l.trim().split(/\s+/); if (p.length >= 6) rows[p.slice(5).join(" ")] = p; }
let bad = 0;
for (const f of snap.filesystems) {
  const r = rows[f.mount]; if (!r) { console.log(`SKIP ${f.mount} (not in df)`); continue; }
  const du = +r[2] * 1024, da = +r[3] * 1024, ok = Math.abs(du - f.used) < 64 * 2 ** 20 && Math.abs(da - f.avail) < 64 * 2 ** 20; bad += !ok;
  console.log(`${ok ? "OK  " : "DIFF"} ${f.mount.padEnd(22)} used df=${du} mon=${f.used} | avail df=${da} mon=${f.avail}`);
}
process.exit(bad ? 1 : 0);
