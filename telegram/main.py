from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from telegram.ext import Application

from db import close_db, init_db
from handlers.logging import register_chat_logging
from handlers.login import register_login_handlers
from handlers.menu import register_menu_handlers
from handlers.register import register_register_handlers

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("tippy.telegram")


def main() -> None:
    token = (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
    if not token:
        print(
            "Missing TELEGRAM_BOT_TOKEN. "
            "Copy telegram/.env.example to telegram/.env and paste your BotFather token.",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        init_db()
    except Exception as exc:
        print(f"Database init failed: {exc}", file=sys.stderr)
        sys.exit(1)

    application = Application.builder().token(token).build()
    register_chat_logging(application)
    register_login_handlers(application)
    # Conversations before menu catch-alls so Account submenu flows win.
    register_register_handlers(application)
    register_menu_handlers(application)

    print("Tippy Telegram bot is running (long polling)…")
    try:
        application.run_polling(allowed_updates=["message"])
    finally:
        close_db()


if __name__ == "__main__":
    main()
