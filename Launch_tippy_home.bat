@echo off
setlocal
title Tippy Home Launcher
cd /d "%~dp0"

REM Point to the portable Node runtime installed in your user folder
set "PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH%"

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

echo.
echo Starting Tippy (home / base URL)...
echo.
echo   Home landing:   http://localhost:3000/
echo   Parent portal:  http://localhost:3000/dashboard
echo   Child play:     http://localhost:3000/play
echo   API:            http://localhost:3001
echo.
echo Two windows open: this one (app) and "Tippy API".
echo Keep both open while using the app. Close them to stop.
echo.

REM Free leftover servers from a previous run so the ports are predictable
powershell -NoProfile -Command "foreach ($p in 3000,3001) { $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; foreach ($c in $conns) { if ($c.OwningProcess -gt 0) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }"

REM Start the Express API in a separate window (parent login + child lookup)
start "Tippy API" cmd /k "set PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH% && npm run dev:server"

REM Open the browser at the base landing page after Vite has had time to boot
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000/"
call npm run dev

echo.
echo The Tippy app has stopped.
echo You can close the "Tippy API" window as well.
pause

endlocal
