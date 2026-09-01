from __future__ import annotations

import asyncio
import logging
from enum import IntEnum

from telegram import ReplyKeyboardMarkup, Update
from telegram.ext import (
    Application,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

from db import (
    get_child,
    get_guardian,
    insert_child,
    list_children,
    update_child,
    upsert_guardian,
)
from handlers.menu import (
    MENU_EDIT_CHILDREN,
    MENU_GUARDIAN,
    MENU_REGISTER_CHILDREN,
    show_account_menu,
)

logger = logging.getLogger(__name__)

CANCEL = "Cancel"
SKIP = "-"
KEEP = "-"


class RegChild(IntEnum):
    NICKNAME = 1
    FULL_NAME = 2
    SCHOOL = 3
    CLASS_NAME = 4


class EditChild(IntEnum):
    SELECT = 10
    NICKNAME = 11
    FULL_NAME = 12
    SCHOOL = 13
    CLASS_NAME = 14


class Guardian(IntEnum):
    NAME = 20
    CONTACT = 21
    FULL_NAME = 22


def _cancel_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup([[CANCEL]], resize_keyboard=True)


def _is_cancel(text: str) -> bool:
    return text.strip().casefold() == CANCEL.casefold()


def _optional_value(text: str) -> str | None:
    cleaned = text.strip()
    if cleaned == SKIP or cleaned == "":
        return None
    return cleaned


def _keep_or_new(text: str, current: str | None) -> str | None:
    cleaned = text.strip()
    if cleaned == KEEP or cleaned == "":
        return current
    return cleaned


async def _cancel_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await show_account_menu(update, "Cancelled. Choose an Account option:")
    return ConversationHandler.END


# --- Register Children Details ---


async def start_register_child(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    context.user_data.clear()
    await update.message.reply_text(
        "Register Children Details\n\n"
        "Enter Nickname:\n"
        f"(Send {CANCEL} to stop)",
        reply_markup=_cancel_keyboard(),
    )
    return RegChild.NICKNAME


async def reg_nickname(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)
    if not text:
        await update.message.reply_text("Nickname is required. Please enter Nickname:")
        return RegChild.NICKNAME
    context.user_data["nickname"] = text
    await update.message.reply_text(
        f"Enter Full name (optional — send {SKIP} to skip):",
        reply_markup=_cancel_keyboard(),
    )
    return RegChild.FULL_NAME


async def reg_full_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)
    context.user_data["full_name"] = _optional_value(text)
    await update.message.reply_text(
        "Enter School:",
        reply_markup=_cancel_keyboard(),
    )
    return RegChild.SCHOOL


async def reg_school(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)
    if not text:
        await update.message.reply_text("School is required. Please enter School:")
        return RegChild.SCHOOL
    context.user_data["school"] = text
    await update.message.reply_text(
        "Enter Class:",
        reply_markup=_cancel_keyboard(),
    )
    return RegChild.CLASS_NAME


async def reg_class(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)
    if not text:
        await update.message.reply_text("Class is required. Please enter Class:")
        return RegChild.CLASS_NAME

    chat_id = update.effective_chat.id
    try:
        child = await asyncio.to_thread(
            insert_child,
            chat_id,
            context.user_data["nickname"],
            context.user_data.get("full_name"),
            context.user_data["school"],
            text,
        )
    except Exception:
        logger.exception("Failed to insert child chat_id=%s", chat_id)
        await show_account_menu(
            update,
            "Sorry, could not save child details. Please try again.",
        )
        context.user_data.clear()
        return ConversationHandler.END

    full = child.full_name or "(none)"
    context.user_data.clear()
    await show_account_menu(
        update,
        "Child registered!\n"
        f"Nickname: {child.nickname}\n"
        f"Full name: {full}\n"
        f"School: {child.school}\n"
        f"Class: {child.class_name}",
    )
    return ConversationHandler.END


# --- Edit Children Details ---


async def start_edit_child(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    context.user_data.clear()
    chat_id = update.effective_chat.id
    children = await asyncio.to_thread(list_children, chat_id)
    if not children:
        await show_account_menu(
            update,
            "No children registered yet. Use Register Children Details first.",
        )
        return ConversationHandler.END

    if len(children) == 1:
        context.user_data["child_id"] = children[0].id
        return await _prompt_edit_nickname(update, context, children[0])

    lines = ["Edit Children Details\n\nSelect a child by number:"]
    for index, child in enumerate(children, start=1):
        lines.append(f"{index}. {child.nickname} ({child.school} / {child.class_name})")
    lines.append(f"\nSend {CANCEL} to stop.")
    context.user_data["children_ids"] = [c.id for c in children]
    await update.message.reply_text("\n".join(lines), reply_markup=_cancel_keyboard())
    return EditChild.SELECT


async def _prompt_edit_nickname(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    child,
) -> int:
    await update.message.reply_text(
        f"Editing {child.nickname}.\n"
        f"Current Nickname: {child.nickname}\n"
        f"Enter new Nickname (or {KEEP} to keep):",
        reply_markup=_cancel_keyboard(),
    )
    return EditChild.NICKNAME


async def edit_select(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    ids: list[int] = context.user_data.get("children_ids") or []
    if not text.isdigit():
        await update.message.reply_text("Please enter a valid number from the list.")
        return EditChild.SELECT
    index = int(text)
    if index < 1 or index > len(ids):
        await update.message.reply_text("Please enter a valid number from the list.")
        return EditChild.SELECT

    child_id = ids[index - 1]
    child = await asyncio.to_thread(get_child, child_id, update.effective_chat.id)
    if child is None:
        await show_account_menu(update, "Child not found. Please try again.")
        return ConversationHandler.END

    context.user_data["child_id"] = child.id
    return await _prompt_edit_nickname(update, context, child)


async def edit_nickname(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    child = await asyncio.to_thread(
        get_child,
        context.user_data["child_id"],
        update.effective_chat.id,
    )
    if child is None:
        await show_account_menu(update, "Child not found. Please try again.")
        return ConversationHandler.END

    context.user_data["nickname"] = _keep_or_new(text, child.nickname) or child.nickname
    current_full = child.full_name or "(none)"
    await update.message.reply_text(
        f"Current Full name: {current_full}\n"
        f"Enter new Full name (optional — {KEEP} to keep, or type a new name):",
        reply_markup=_cancel_keyboard(),
    )
    return EditChild.FULL_NAME


async def edit_full_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    child = await asyncio.to_thread(
        get_child,
        context.user_data["child_id"],
        update.effective_chat.id,
    )
    if child is None:
        await show_account_menu(update, "Child not found. Please try again.")
        return ConversationHandler.END

    if text == KEEP:
        context.user_data["full_name"] = child.full_name
    else:
        context.user_data["full_name"] = _optional_value(text)

    await update.message.reply_text(
        f"Current School: {child.school}\n"
        f"Enter new School (or {KEEP} to keep):",
        reply_markup=_cancel_keyboard(),
    )
    return EditChild.SCHOOL


async def edit_school(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    child = await asyncio.to_thread(
        get_child,
        context.user_data["child_id"],
        update.effective_chat.id,
    )
    if child is None:
        await show_account_menu(update, "Child not found. Please try again.")
        return ConversationHandler.END

    context.user_data["school"] = _keep_or_new(text, child.school) or child.school
    await update.message.reply_text(
        f"Current Class: {child.class_name}\n"
        f"Enter new Class (or {KEEP} to keep):",
        reply_markup=_cancel_keyboard(),
    )
    return EditChild.CLASS_NAME


async def edit_class(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    chat_id = update.effective_chat.id
    child_id = context.user_data["child_id"]
    child = await asyncio.to_thread(get_child, child_id, chat_id)
    if child is None:
        await show_account_menu(update, "Child not found. Please try again.")
        return ConversationHandler.END

    class_name = _keep_or_new(text, child.class_name) or child.class_name
    try:
        updated = await asyncio.to_thread(
            update_child,
            child_id,
            chat_id,
            context.user_data["nickname"],
            context.user_data.get("full_name"),
            context.user_data["school"],
            class_name,
        )
    except Exception:
        logger.exception("Failed to update child id=%s", child_id)
        await show_account_menu(update, "Sorry, could not update child details.")
        context.user_data.clear()
        return ConversationHandler.END

    if updated is None:
        await show_account_menu(update, "Child not found. Please try again.")
        context.user_data.clear()
        return ConversationHandler.END

    full = updated.full_name or "(none)"
    context.user_data.clear()
    await show_account_menu(
        update,
        "Child details updated!\n"
        f"Nickname: {updated.nickname}\n"
        f"Full name: {full}\n"
        f"School: {updated.school}\n"
        f"Class: {updated.class_name}",
    )
    return ConversationHandler.END


# --- Guardian / Parent Contact ---


async def start_guardian(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    context.user_data.clear()
    existing = await asyncio.to_thread(get_guardian, update.effective_chat.id)
    if existing:
        intro = (
            "Guardian or Parent Contact\n\n"
            f"Current name: {existing.guardian_name}\n"
            f"Current contact: {existing.contact}\n"
            f"Current full name: {existing.full_name}\n\n"
            "Enter guardian name (or - to keep current):"
        )
        context.user_data["existing_guardian"] = {
            "guardian_name": existing.guardian_name,
            "contact": existing.contact,
            "full_name": existing.full_name,
        }
    else:
        intro = (
            "Guardian or Parent Contact\n\n"
            "Enter guardian name:\n"
            f"(Send {CANCEL} to stop)"
        )
    await update.message.reply_text(intro, reply_markup=_cancel_keyboard())
    return Guardian.NAME


async def guardian_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    existing = context.user_data.get("existing_guardian")
    if existing and text == KEEP:
        context.user_data["guardian_name"] = existing["guardian_name"]
    elif not text:
        await update.message.reply_text("Guardian name is required. Please enter it:")
        return Guardian.NAME
    else:
        context.user_data["guardian_name"] = text

    prompt = "Enter contact (phone / WhatsApp):"
    if existing:
        prompt = (
            f"Current contact: {existing['contact']}\n"
            f"Enter contact (or {KEEP} to keep):"
        )
    await update.message.reply_text(prompt, reply_markup=_cancel_keyboard())
    return Guardian.CONTACT


async def guardian_contact(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    existing = context.user_data.get("existing_guardian")
    if existing and text == KEEP:
        context.user_data["contact"] = existing["contact"]
    elif not text:
        await update.message.reply_text("Contact is required. Please enter it:")
        return Guardian.CONTACT
    else:
        context.user_data["contact"] = text

    prompt = "Enter full name:"
    if existing:
        prompt = (
            f"Current full name: {existing['full_name']}\n"
            f"Enter full name (or {KEEP} to keep):"
        )
    await update.message.reply_text(prompt, reply_markup=_cancel_keyboard())
    return Guardian.FULL_NAME


async def guardian_full_name(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    text = (update.message.text or "").strip()
    if _is_cancel(text):
        return await _cancel_flow(update, context)

    existing = context.user_data.get("existing_guardian")
    if existing and text == KEEP:
        full_name = existing["full_name"]
    elif not text:
        await update.message.reply_text("Full name is required. Please enter it:")
        return Guardian.FULL_NAME
    else:
        full_name = text

    try:
        row = await asyncio.to_thread(
            upsert_guardian,
            update.effective_chat.id,
            context.user_data["guardian_name"],
            context.user_data["contact"],
            full_name,
        )
    except Exception:
        logger.exception("Failed to upsert guardian chat_id=%s", update.effective_chat.id)
        await show_account_menu(update, "Sorry, could not save guardian contact.")
        context.user_data.clear()
        return ConversationHandler.END

    context.user_data.clear()
    await show_account_menu(
        update,
        "Guardian contact saved!\n"
        f"Name: {row.guardian_name}\n"
        f"Contact: {row.contact}\n"
        f"Full name: {row.full_name}",
    )
    return ConversationHandler.END


def build_register_conversations() -> list[ConversationHandler]:
    cancel_filter = filters.TEXT & filters.Regex(f"(?i)^{CANCEL}$")

    register_child = ConversationHandler(
        entry_points=[
            MessageHandler(
                filters.TEXT & filters.Regex(f"(?i)^{MENU_REGISTER_CHILDREN}$"),
                start_register_child,
            ),
        ],
        states={
            RegChild.NICKNAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_nickname)],
            RegChild.FULL_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_full_name)],
            RegChild.SCHOOL: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_school)],
            RegChild.CLASS_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_class)],
        },
        fallbacks=[MessageHandler(cancel_filter, _cancel_flow)],
        allow_reentry=True,
    )

    edit_child = ConversationHandler(
        entry_points=[
            MessageHandler(
                filters.TEXT & filters.Regex(f"(?i)^{MENU_EDIT_CHILDREN}$"),
                start_edit_child,
            ),
        ],
        states={
            EditChild.SELECT: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_select)],
            EditChild.NICKNAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_nickname)],
            EditChild.FULL_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_full_name)],
            EditChild.SCHOOL: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_school)],
            EditChild.CLASS_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_class)],
        },
        fallbacks=[MessageHandler(cancel_filter, _cancel_flow)],
        allow_reentry=True,
    )

    guardian = ConversationHandler(
        entry_points=[
            MessageHandler(
                filters.TEXT & filters.Regex(f"(?i)^{MENU_GUARDIAN}$"),
                start_guardian,
            ),
        ],
        states={
            Guardian.NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, guardian_name)],
            Guardian.CONTACT: [MessageHandler(filters.TEXT & ~filters.COMMAND, guardian_contact)],
            Guardian.FULL_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, guardian_full_name),
            ],
        },
        fallbacks=[MessageHandler(cancel_filter, _cancel_flow)],
        allow_reentry=True,
    )

    return [register_child, edit_child, guardian]


def register_register_handlers(application: Application) -> None:
    for handler in build_register_conversations():
        application.add_handler(handler)
