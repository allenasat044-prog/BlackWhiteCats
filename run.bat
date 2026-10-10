@echo off
REM Windows launcher (double-click)
cd /d "%~dp0"
where node >nul 2>nul || (echo Install Node.js ^>= 18.15 from https://nodejs.org & pause & exit /b 1)
if not exist dist\index.html (call npm install --no-audit --no-fund && call npm run build)
node server\index.mjs %*
pause
