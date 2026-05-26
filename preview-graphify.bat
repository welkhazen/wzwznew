@echo off
setlocal
cd /d "%~dp0"

echo [1/3] Generating preview bundle...
node scripts\graphify.mjs export preview-bundle .
if errorlevel 1 goto :fail

echo [2/3] Generating callflow html...
node scripts\graphify.mjs export callflow-html .
if errorlevel 1 goto :fail

echo [3/3] Starting local server on http://localhost:8767 ...
start "" http://localhost:8767/graphify-out/graph.html
python -m http.server 8767
exit /b 0

:fail
echo Failed. Ensure Node.js and Python are installed and available on PATH.
exit /b 1
