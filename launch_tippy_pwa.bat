@echo off
setlocal
title Tippy PWA Launcher
cd /d "%~dp0"

REM Point to the portable Node runtime installed in your user folder
set "PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH%"

REM Serve on the familiar PWA port so it never clashes with the dev API (3001)
set "PORT=4173"
set "TIPPY_CODE=AB7K2"

REM Make sure Node is available before continuing
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: Node.js was not found.
  echo Expected it at: %USERPROFILE%\node-portable\node-v24.19.0-win-x64
  echo.
  echo Please install Node.js or restore the portable copy, then try again.
  echo.
  pause
  exit /b 1
)

REM Install dependencies only if missing (first run only)
if not exist "node_modules" (
  echo.
  echo Installing dependencies for the first time, please wait...
  echo.
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo.
    echo ERROR: Dependency installation failed. See the messages above.
    echo.
    pause
    exit /b 1
  )
)

REM Build the production PWA (generates the service worker + manifest)
echo.
echo Building the Tippy PWA, please wait...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo ERROR: Build failed. See the messages above.
  echo.
  pause
  exit /b 1
)

REM Work out this machine's LAN address so an iPad can reach the server
set "LANIP="
powershell -NoProfile -Command "$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue; $best = ''; foreach ($i in $ips) { if ($i.IPAddress -like '192.168.*') { $best = $i.IPAddress; break } }; if (-not $best) { foreach ($i in $ips) { if ($i.IPAddress -like '10.*') { $best = $i.IPAddress; break } } }; $best" > "%TEMP%\tippy_lanip.txt" 2>nul
if exist "%TEMP%\tippy_lanip.txt" set /p LANIP=<"%TEMP%\tippy_lanip.txt"
del "%TEMP%\tippy_lanip.txt" >nul 2>nul

echo.
echo Starting Tippy PWA on http://localhost:%PORT%/
echo.
echo This uses the Express server (npm start), NOT vite preview, because the
echo personalised manifest at /api/manifest and the child lookup at /api/child
echo only exist on Express. vite preview cannot serve them.
echo.
echo   Install page:  http://localhost:%PORT%/u/%TIPPY_CODE%
echo   Manifest:      http://localhost:%PORT%/api/manifest?access_code=%TIPPY_CODE%
echo                  Must report "start_url": "/launch/%TIPPY_CODE%"
if defined LANIP echo   On iPad/iPhone: http://%LANIP%:%PORT%/u/%TIPPY_CODE%
echo.
echo Before retesting on a device, DELETE the old Tippy Home Screen icon.
echo iOS keeps the start_url captured when the icon was first added.
echo.
echo Over plain http the service worker will not register (needs https or
echo localhost), but Add to Home Screen and the personalised start_url still
echo work - that is what this launcher is for.
echo.
echo Keep this window open while using the app. Close it to stop the app.
echo.

REM Free a leftover server from a previous run so the port is predictable
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; foreach ($c in $conns) { if ($c.OwningProcess -gt 0) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } }"

REM Once the server is up, check the manifest and open the install page
REM Uses & rather than && so the page still opens when a check fails.
start "Tippy PWA Check" cmd /k "set PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH% & timeout /t 6 >nul & npm run verify:pwa -- http://localhost:%PORT% & start http://localhost:%PORT%/u/%TIPPY_CODE%"

REM Serve the built app + API on all interfaces (blocks until you close this window)
call npm start

REM If the server exits, keep the window open so any message is readable
echo.
echo The Tippy PWA has stopped.
echo You can close the "Tippy PWA Check" window as well.
pause
