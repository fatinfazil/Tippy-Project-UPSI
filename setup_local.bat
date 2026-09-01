@echo off
setlocal EnableExtensions
title Tippy Local Setup
cd /d "%~dp0"

REM Point to the portable Node runtime installed in your user folder
set "PATH=%USERPROFILE%\node-portable\node-v24.19.0-win-x64;%PATH%"

echo.
echo ========================================
echo   Tippy - one-time local setup
echo ========================================
echo.

REM ---- Node ----
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Expected it at: %USERPROFILE%\node-portable\node-v24.19.0-win-x64
  echo.
  echo Install Node.js 22+ or restore the portable copy, then run this again.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
echo [OK] Node %NODE_VER%

REM ---- npm dependencies ----
echo.
echo Installing npm dependencies...
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo.
  echo ERROR: npm install failed. See the messages above.
  echo.
  pause
  exit /b 1
)
echo [OK] node_modules ready

echo.
echo ----------------------------------------
echo   Next steps
echo ----------------------------------------
echo.
echo Double-click Launch_tippy.bat to start Vite + the API.
echo Demo access codes: AB7K2 ^(Aina^), DEMO1 ^(Adam^), DEMO2 ^(Mia^)
echo.
pause
endlocal
