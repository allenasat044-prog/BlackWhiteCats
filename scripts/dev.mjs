// npm run dev: API server + Vite dev server together (cross-platform)
import { spawn } from "node:child_process";
const run = (a) => spawn(process.execPath, a, { stdio: "inherit" });
const api = run(["server/index.mjs", "--no-open"]), vite = run(["node_modules/vite/bin/vite.js"]);
const stop = () => { api.kill(); vite.kill(); process.exit(); };
process.on("SIGINT", stop); process.on("SIGTERM", stop); api.on("exit", stop); vite.on("exit", stop);
