@echo off
setlocal
title Tippy Demo - Aina
cd /d "%~dp0"

REM Point to the portable Node runtime installed in your user folder
set "PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH%"

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

echo.
echo Starting Tippy demo as Aina (%TIPPY_CODE%)...
echo.
echo   Opening:      http://localhost:3000/launch/%TIPPY_CODE%
echo                 Saves the code, then drops straight into the game.
echo   Landing page: http://localhost:3000/u/%TIPPY_CODE%
echo   API:          http://localhost:3001
echo.
echo Keep this window open while using the app. Close it to stop the app.
echo.

REM Free leftover servers from a previous run so the ports are predictable
powershell -NoProfile -Command "foreach ($p in 3000,3001) { $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; foreach ($c in $conns) { if ($c.OwningProcess -gt 0) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }"

REM Start the Express API in a separate window (needed for child lookup)
start "Tippy API" cmd /k "set PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH% && npm run dev:server"

REM Open Aina's launch link after Vite has had time to boot
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000/launch/%TIPPY_CODE%"
call npm run dev

REM If the server exits, keep the window open so any message is readable
echo.
echo The Tippy app has stopped.
echo You can close the "Tippy API" window as well.
pause
