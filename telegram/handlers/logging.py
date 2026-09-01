from __future__ import annotations

import asyncio
import logging

from telegram import Update
from telegram.ext import Application, ContextTypes, MessageHandler, filters

from db import log_chat_message

logger = logging.getLogger(__name__)


def _display_name(update: Update) -> str:
    user = update.effective_user
    if user is None:
        return "unknown"
    if user.username:
        return f"@{user.username}"
    full = " ".join(
        part for part in (user.first_name, user.last_name) if part
    ).strip()
    return full or "unknown"


async def log_incoming_message(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:
    if update.message is None or update.effective_chat is None:
        return

    text = update.message.text
    if text is None:
        return

    chat_id = update.effective_chat.id
    user_name = _display_name(update)

    try:
        await asyncio.to_thread(log_chat_message, chat_id, user_name, text)
    except Exception:
        logger.exception(
            "Failed to log telegram message chat_id=%s user=%s",
            chat_id,
            user_name,
        )


def register_chat_logging(application: Application) -> None:
    # group=-1: run for every text message alongside other handlers (e.g. hi).
    application.add_handler(
        MessageHandler(filters.TEXT, log_incoming_message),
        group=-1,
    )
