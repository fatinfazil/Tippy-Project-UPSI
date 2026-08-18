@echo off
setlocal
title Clean Tippy Cache
cd /d "%~dp0"

set "PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH%"

echo.
echo Cleaning Tippy build cache...
echo.

REM Remove the production build output
if exist "dist" (
  rmdir /s /q "dist"
  echo   - Removed dist\
)

REM Remove Vite's on-disk cache
if exist "node_modules\.vite" (
  rmdir /s /q "node_modules\.vite"
  echo   - Removed node_modules\.vite\
)

REM Clear npm's cache (harmless; forces clean dependency resolution)
where npm >nul 2>nul && npm cache clean --force >nul 2>nul && echo   - Cleared npm cache

echo.
echo Done. Build cache cleared. Child data lives in Postgres (DATABASE_URL), not in this folder.
echo.
echo NOTE: The browser/service-worker cache is separate. After launching the PWA,
echo reload the page once (Ctrl+Shift+R), or in DevTools ^> Application ^> Service Workers
echo tick "Update on reload" to see your latest changes.
echo.
echo NOTE: Retesting an install on an iPad/iPhone? A .bat cannot reach the device.
echo On the device you must:
echo   1. Delete the old Tippy icon from the Home Screen. iOS keeps the start_url
echo      captured when the icon was first added, so an old icon keeps opening
echo      the old route no matter what the server now returns.
echo   2. Settings ^> Safari ^> Advanced ^> Website Data, and remove the Tippy entry
echo      to clear the saved access_code and the old service worker.
echo.
pause
