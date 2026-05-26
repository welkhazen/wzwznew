@echo off
setlocal
cd /d "%~dp0"

echo [1/3] Generating preview bundle...
node scripts\graphify.mjs export preview-bundle .
if errorlevel 1 goto :fail

echo [2/3] Generating callflow html...
node scripts\graphify.mjs export callflow-html .
if errorlevel 1 goto :fail

echo [3/3] Starting local server on http://127.0.0.1:4173 ...
start "" http://127.0.0.1:4173/docs/callflow.html
python -m http.server 4173 --bind 127.0.0.1
exit /b 0

:fail
echo Failed. Ensure Node.js and Python are installed and available on PATH.
exit /b 1
