@echo off
setlocal
title Tippy Telegram Bot
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: Python was not found on PATH.
  echo Install Python 3.11+ from https://www.python.org/downloads/
  echo and ensure "Add python.exe to PATH" is checked.
  echo.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo.
  echo Creating Python virtual environment...
  echo.
  python -m venv .venv
  if errorlevel 1 (
    echo.
    echo ERROR: Failed to create .venv
    echo.
    pause
    exit /b 1
  )
)

if not exist ".env" (
  echo.
  echo ERROR: telegram\.env is missing.
  echo Copy .env.example to .env and paste your BotFather token as TELEGRAM_BOT_TOKEN.
  echo.
  pause
  exit /b 1
)

echo.
echo Installing / updating dependencies...
call ".venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
call ".venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet
if errorlevel 1 (
  echo.
  echo ERROR: Dependency installation failed. See the messages above.
  echo.
  pause
  exit /b 1
)

echo.
echo Starting Tippy Telegram bot (dev / long polling)...
echo Message @TippyWiraHijauBot with "hi" to test.
echo Press Ctrl+C to stop.
echo.

call ".venv\Scripts\python.exe" main.py
if errorlevel 1 (
  echo.
  echo ERROR: Bot exited with an error. See the messages above.
  echo.
  pause
  exit /b 1
)

endlocal
