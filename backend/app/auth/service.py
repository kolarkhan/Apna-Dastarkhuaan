from datetime import datetime, timezone

from bson import ObjectId

from app.auth.schemas import LoginRequest, RegisterRequest, ResetPasswordRequest
from app.core.exceptions import ConflictError, UnauthorizedError, ValidationAppError
from app.core.security import create_token, create_token_pair, decode_token, hash_password, verify_password
from app.database import get_db


def serialize_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
        "phone": doc["phone"],
        "role": doc["role"],
        "avatar": doc.get("avatar"),
        "status": doc.get("status", "active"),
        "notification_preferences": doc.get(
            "notification_preferences", {"order_updates": True, "chat_messages": True, "announcements": True}
        ),
    }


async def register_user(payload: RegisterRequest) -> dict:
    db = get_db()

    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise ConflictError("An account with this email already exists")

    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "avatar": None,
        "status": "active",
        "notification_preferences": {"order_updates": True, "chat_messages": True, "announcements": True},
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(doc)

    tokens = create_token_pair(str(doc["_id"]), doc["role"])
    return {"user": serialize_user(doc), **tokens}


async def login_user(payload: LoginRequest) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise UnauthorizedError("Invalid email or password")

    if user.get("status") in ("suspended", "deleted"):
        raise UnauthorizedError("Your account has been suspended. Contact support.")

    tokens = create_token_pair(str(user["_id"]), user["role"])
    return {"user": serialize_user(user), **tokens}


async def refresh_tokens(refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid or expired refresh token")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or user.get("status") in ("suspended", "deleted"):
        raise UnauthorizedError("Account no longer active")

    return create_token_pair(str(user["_id"]), user["role"])


async def request_password_reset(email: str) -> str | None:
    """Returns a reset token. In production this would be emailed, not returned to the caller."""
    db = get_db()
    user = await db.users.find_one({"email": email.lower()})
    if not user:
        # Do not reveal whether the email exists.
        return None
    return create_token(str(user["_id"]), user["role"], "reset")


async def reset_password(payload: ResetPasswordRequest) -> None:
    token_payload = decode_token(payload.token)
    if token_payload is None or token_payload.get("type") != "reset":
        raise ValidationAppError("This reset link is invalid or has expired")

    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(token_payload["sub"])},
        {"$set": {"password_hash": hash_password(payload.new_password), "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise ValidationAppError("This reset link is invalid or has expired")
