@echo off
:: Reddit Music Tracker — double-click this file to start

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is required but not installed.
    echo.
    echo Install it from: https://nodejs.org
    echo Download the LTS version and run the installer.
    start https://nodejs.org
    echo.
    pause
    exit /b 1
)

where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo curl is required but not installed.
    echo.
    echo On Windows 10+, curl should be built-in.
    echo If missing, install it from: https://curl.se/download.html
    echo.
    pause
    exit /b 1
)

echo Starting Reddit Music Tracker...
echo.

node server.js --open

pause
