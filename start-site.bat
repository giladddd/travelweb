@echo off
cd /d "%~dp0"
echo Starting Smart Traveller local server...
start "" node server.js
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080"
