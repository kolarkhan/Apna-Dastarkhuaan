from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, get_current_user
from app.core.exceptions import NotFoundError
from app.core.pagination import PageParams, build_paged_response, page_params
from app.database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "body": doc["body"],
        "type": doc["type"],
        "data": doc.get("data", {}),
        "read": doc.get("read", False),
        "created_at": doc["created_at"],
    }


@router.get("")
async def list_notifications(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    params: Annotated[PageParams, Depends(page_params)],
    unread_only: bool = False,
):
    db = get_db()
    match: dict = {"user_id": current_user.id}
    if unread_only:
        match["read"] = False

    total = await db.notifications.count_documents(match)
    cursor = db.notifications.find(match).sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [_serialize(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.get("/unread-count")
async def unread_count(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    db = get_db()
    count = await db.notifications.count_documents({"user_id": current_user.id, "read": False})
    return {"count": count}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    db = get_db()
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": current_user.id}, {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise NotFoundError("Notification not found")
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    db = get_db()
    await db.notifications.update_many({"user_id": current_user.id, "read": False}, {"$set": {"read": True}})
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(notification_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    db = get_db()
    result = await db.notifications.delete_one({"_id": ObjectId(notification_id), "user_id": current_user.id})
    if result.deleted_count == 0:
        raise NotFoundError("Notification not found")
