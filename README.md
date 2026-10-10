# Black and White cats - Linux Storage Monitoring System (Linux / macOS / Windows)

Requires only Node.js >= 18.15. No Python, no npm install needed to run (the site is prebuilt in dist/).

    npm start                # or: ./run.sh (mac/linux), double-click run.command (mac) / run.bat (windows)
    -> http://127.0.0.1:8080  (opens automatically)

| Command | What it does |
|---|---|
| npm start | collector + API + dashboard in ONE process |
| npm run monitor | one scan, prints summary, exit code 0 ok / 1 warning / 2 critical (cron, Task Scheduler, Nagios) |
| npm run report | prints and saves the full text report |
| npm run verify | cross-checks numbers against the OS `df` |
| npm run dev | hot-reload frontend + API (needs npm install) |

Env: PORT=8090, HOST=0.0.0.0 (Windows: `set PORT=8090 && npm start`). No auth is built in.

How each OS is read
- Linux: /proc/mounts + statfs (same source as df); pseudo filesystems, tmpfs, container internals, bind duplicates skipped.
- macOS: `mount` + statfs; hidden system volumes skipped, sealed "/" replaced by /System/Volumes/Data.
- Windows: drive letters + statfs (+ PowerShell for the filesystem type, optional). Inodes are not exposed by NTFS, shown as "n/a".
- Largest directories: `du` on Linux/macOS, built-in walker on Windows.

Alerts (config/config.json): FIRING/RESOLVED events go to data/alerts.log, data/alerts.jsonl, syslog (Linux/macOS), optional webhook and optional shell command
(set alerts.command.enabled and run, env: ALERT_STATE, ALERT_LEVEL, ALERT_MOUNT, ALERT_MESSAGE - use it for mail, msg, notify-send...).
Growth alerts need >= 3 samples spanning >= 60 s. Reports: reports/storage-report-YYYY-MM-DD.txt.

Team tab (FAQ page): edit config/team.json - four members with name, role and github (profile URL or username). No rebuild needed.
