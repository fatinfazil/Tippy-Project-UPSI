from __future__ import annotations

import re
from datetime import datetime
from zoneinfo import ZoneInfo

from telegram import ReplyKeyboardMarkup, Update
from telegram.ext import Application, ContextTypes, MessageHandler, filters

MENU_ACCOUNT = "Account"
MENU_VIEW = "View"
MENU_HELP = "Help"
MENU_SURVEY = "Survey"

MENU_REGISTER_CHILDREN = "Register Children Details"
MENU_EDIT_CHILDREN = "Edit Children Details"
MENU_GUARDIAN = "Guardian or Parent Contact"
MENU_BACK_MAIN = "Back to Main Menu"

MAIN_MENU_OPTIONS = (MENU_ACCOUNT, MENU_VIEW, MENU_HELP, MENU_SURVEY)
ACCOUNT_MENU_OPTIONS = (
    MENU_REGISTER_CHILDREN,
    MENU_EDIT_CHILDREN,
    MENU_GUARDIAN,
    MENU_BACK_MAIN,
)

_MY_TZ = ZoneInfo("Asia/Kuala_Lumpur")

_GREETING = re.compile(r"^(hi|hello)\b", re.IGNORECASE)
_MAIN_MENU_CHOICE = re.compile(
    rf"^({'|'.join(MAIN_MENU_OPTIONS)})$",
    re.IGNORECASE,
)
_ACCOUNT_MENU_CHOICE = re.compile(
    rf"^({'|'.join(re.escape(o) for o in ACCOUNT_MENU_OPTIONS)})$",
    re.IGNORECASE,
)

_SORRY = (
    "Sorry I don't understand your request, please choose the following options."
)


def malaysia_day_period() -> str:
    """Return morning / afternoon / evening using Malaysia local time."""
    hour = datetime.now(_MY_TZ).hour
    if hour < 12:
        return "morning"
    if hour < 18:
        return "afternoon"
    return "evening"


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [
            [MENU_ACCOUNT, MENU_VIEW],
            [MENU_HELP, MENU_SURVEY],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


def account_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [
            [MENU_REGISTER_CHILDREN],
            [MENU_EDIT_CHILDREN],
            [MENU_GUARDIAN],
            [MENU_BACK_MAIN],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


async def show_main_menu(update: Update, intro: str) -> None:
    if update.message is None:
        return
    await update.message.reply_text(intro, reply_markup=main_menu_keyboard())


async def show_account_menu(update: Update, intro: str) -> None:
    if update.message is None:
        return
    await update.message.reply_text(intro, reply_markup=account_menu_keyboard())


async def handle_greeting(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None or update.effective_user is None:
        return
    name = (update.effective_user.first_name or "").strip() or "friend"
    period = malaysia_day_period()
    await show_main_menu(
        update,
        f"Good {period} {name}, I am Tippy!!\n\nPlease choose an option:",
    )


async def handle_main_menu_choice(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:
    if update.message is None or update.message.text is None:
        return

    choice = update.message.text.strip().casefold()
    if choice == MENU_ACCOUNT.casefold():
        await show_account_menu(
            update,
            "Account menu — please choose an option:",
        )
    elif choice == MENU_VIEW.casefold():
        await show_main_menu(
            update,
            "View: coming soon. Please pick another option from the menu.",
        )
    elif choice == MENU_HELP.casefold():
        await show_main_menu(
            update,
            "Help: send Hi or Hello to open the main menu anytime.\n"
            "Account lets you add/edit children and guardian contact.\n"
            "Tap an option below.",
        )
    elif choice == MENU_SURVEY.casefold():
        await show_main_menu(
            update,
            "Survey: coming soon. Please pick another option from the menu.",
        )
    else:
        await show_main_menu(update, _SORRY)


async def handle_account_menu_choice(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:
    """Handle Back to Main Menu; other Account options are ConversationHandler entry points."""
    if update.message is None or update.message.text is None:
        return

    choice = update.message.text.strip().casefold()
    if choice == MENU_BACK_MAIN.casefold():
        await show_main_menu(update, "Back to main menu. Please choose an option:")
        return

    # Register / Edit / Guardian are handled by ConversationHandlers registered first.
    # If we get here, conversations were not started — show Account menu again.
    await show_account_menu(update, "Please choose an Account option:")


async def handle_unknown(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await show_main_menu(update, _SORRY)


def register_menu_handlers(application: Application) -> None:
    application.add_handler(
        MessageHandler(filters.TEXT & filters.Regex(_GREETING), handle_greeting),
    )
    application.add_handler(
        MessageHandler(
            filters.TEXT & filters.Regex(_MAIN_MENU_CHOICE),
            handle_main_menu_choice,
        ),
    )
    application.add_handler(
        MessageHandler(
            filters.TEXT & filters.Regex(_ACCOUNT_MENU_CHOICE),
            handle_account_menu_choice,
        ),
    )
    # Catch-all for other text (must be registered last in this group).
    application.add_handler(MessageHandler(filters.TEXT, handle_unknown))
