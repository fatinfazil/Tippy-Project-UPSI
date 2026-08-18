from __future__ import annotations

import asyncio
import logging

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from db import issue_login_otp
from handlers.menu import show_main_menu

logger = logging.getLogger(__name__)


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None or update.effective_chat is None:
        return

    args = context.args or []
    if args and args[0].startswith("login_"):
        nonce = args[0][len("login_") :].strip()
        if not nonce:
            await update.message.reply_text(
                "Invalid login link. Please start again from the Tippy website (/dashboard)."
            )
            return

        chat_id = update.effective_chat.id
        try:
            otp, error = await asyncio.to_thread(issue_login_otp, nonce, chat_id)
        except Exception:
            logger.exception("Failed to issue login OTP nonce=%s", nonce)
            await update.message.reply_text(
                "Sorry, could not create a login code. Please try again from the website."
            )
            return

        if error or not otp:
            await update.message.reply_text(error or "Login failed. Try again from /dashboard.")
            return

        await update.message.reply_text(
            "Your Tippy parent login code is:\n\n"
            f"**{otp}**\n\n"
            "Enter this 4-digit code on the website within 5 minutes.",
            parse_mode="Markdown",
        )
        return

    # Normal /start — show the usual greeting menu path via a short tip.
    name = (update.effective_user.first_name if update.effective_user else None) or "friend"
    await show_main_menu(
        update,
        f"Hello {name}! I am Tippy.\n\n"
        "Send Hi or Hello for the main menu.\n"
        "Parents can also log in at the Tippy website under /dashboard.",
    )


def register_login_handlers(application: Application) -> None:
    application.add_handler(CommandHandler("start", handle_start))
