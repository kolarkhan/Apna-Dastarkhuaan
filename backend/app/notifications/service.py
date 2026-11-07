from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.database import get_db

# Maps a notification type to the preference key that can mute it. Types left
# out (account_status, kitchen_status) are always delivered — they're not
# promotional, the user needs to see them regardless of preference.
_PREFERENCE_BY_TYPE = {
    "new_order": "order_updates",
    "order_status": "order_updates",
    "order_cancelled": "order_updates",
    "chat_message": "chat_messages",
    "announcement": "announcements",
}


async def create_notification(
    user_id: str,
    title: str,
    body: str,
    type_: str,
    data: dict[str, Any] | None = None,
) -> None:
    db = get_db()

    pref_key = _PREFERENCE_BY_TYPE.get(type_)
    if pref_key:
        user = await db.users.find_one({"_id": ObjectId(user_id)}, {"notification_preferences": 1})
        prefs = (user or {}).get("notification_preferences", {})
        if prefs.get(pref_key, True) is False:
            return

    await db.notifications.insert_one(
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "title": title,
            "body": body,
            "type": type_,
            "data": data or {},
            "read": False,
            "created_at": datetime.now(timezone.utc),
        }
    )
