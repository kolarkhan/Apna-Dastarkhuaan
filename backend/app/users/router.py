from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, File, UploadFile

from app.auth.service import serialize_user
from app.core.deps import CurrentUser, get_current_user
from app.core.exceptions import NotFoundError, UnauthorizedError, ValidationAppError
from app.core.security import hash_password, verify_password
from app.core.storage import get_storage_provider, validate_image_upload
from app.database import get_db
from app.users.schemas import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    UpdateNotificationPreferencesRequest,
    UpdateProfileRequest,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_my_profile(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    if not user:
        raise NotFoundError("User not found")
    return serialize_user(user)


@router.patch("/me")
async def update_my_profile(
    payload: UpdateProfileRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": ObjectId(current_user.id)}, {"$set": updates})

    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return serialize_user(user)


@router.post("/me/avatar")
async def upload_avatar(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    validate_image_upload(file)
    url = await get_storage_provider().upload(file, folder="avatars")

    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"avatar": url, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"avatar": url}


@router.post("/me/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    if not user or not verify_password(payload.current_password, user["password_hash"]):
        raise UnauthorizedError("Current password is incorrect")

    if payload.current_password == payload.new_password:
        raise ValidationAppError("New password must be different from the current password")

    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"password_hash": hash_password(payload.new_password), "updated_at": datetime.now(timezone.utc)}},
    )
    return {"message": "Password changed successfully"}


@router.patch("/me/notification-preferences")
async def update_notification_preferences(
    payload: UpdateNotificationPreferencesRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"notification_preferences": payload.model_dump(), "updated_at": datetime.now(timezone.utc)}},
    )
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return serialize_user(user)


@router.delete("/me")
async def delete_my_account(
    payload: DeleteAccountRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise UnauthorizedError("Incorrect password")

    now = datetime.now(timezone.utc)
    anonymized_email = f"deleted_{current_user.id}_{user['email']}"
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"status": "deleted", "email": anonymized_email, "updated_at": now}},
    )

    if current_user.role == "kitchen_owner":
        await db.kitchens.update_one(
            {"owner_id": current_user.id},
            {"$set": {"status": "suspended", "is_open": False, "updated_at": now}},
        )

    return {"message": "Account deleted"}
