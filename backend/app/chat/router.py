from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.chat.schemas import SendMessageRequest
from app.core.deps import CurrentUser, get_current_user
from app.core.exceptions import ValidationAppError
from app.core.ws_manager import order_ws_manager
from app.database import get_db
from app.notifications.service import create_notification
from app.orders import service as orders_service

router = APIRouter(prefix="/orders/{order_id}/messages", tags=["chat"])


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "order_id": doc["order_id"],
        "sender_id": doc["sender_id"],
        "sender_role": doc["sender_role"],
        "text": doc["text"],
        "created_at": doc["created_at"],
    }


@router.get("")
async def list_messages(order_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    order = await orders_service.get_order_or_404(order_id)
    await orders_service.assert_can_view(order, current_user.id, current_user.role)

    db = get_db()
    cursor = db.messages.find({"order_id": order_id}).sort("created_at", 1)
    return [_serialize(d) async for d in cursor]


@router.post("", status_code=201)
async def send_message(
    order_id: str,
    payload: SendMessageRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    if current_user.role not in ("customer", "kitchen_owner"):
        raise ValidationAppError("Only the customer and kitchen owner on this order can chat")

    order = await orders_service.get_order_or_404(order_id)
    await orders_service.assert_can_view(order, current_user.id, current_user.role)

    if order["order_status"] not in orders_service.CHAT_ENABLED_STATUSES:
        raise ValidationAppError("Chat opens once the kitchen accepts the order")

    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "order_id": order_id,
        "sender_id": current_user.id,
        "sender_role": current_user.role,
        "text": payload.text.strip(),
        "created_at": now,
    }
    await db.messages.insert_one(doc)

    message = _serialize(doc)
    await order_ws_manager.broadcast(order_id, {"type": "chat_message", "order_id": order_id, "message": message})

    if current_user.role == "customer":
        recipient_id, title = None, "New message"
        kitchen = await db.kitchens.find_one({"_id": ObjectId(order["kitchen_id"])})
        if kitchen:
            recipient_id = kitchen["owner_id"]
    else:
        recipient_id = order["customer_id"]

    if recipient_id:
        preview = payload.text.strip()[:60]
        await create_notification(
            recipient_id,
            "New message",
            f"Order #{order['order_number']}: {preview}",
            "chat_message",
            {"order_id": order_id},
        )

    return message
