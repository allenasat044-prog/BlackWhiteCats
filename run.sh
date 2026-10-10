#!/usr/bin/env bash
# macOS / Linux launcher. On macOS you can also double-click run.command
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js >= 18.15 from https://nodejs.org"; exit 1; }
if [ ! -f dist/index.html ]; then npm install --no-audit --no-fund && npm run build || exit 1; fi
exec node server/index.mjs "$@"
