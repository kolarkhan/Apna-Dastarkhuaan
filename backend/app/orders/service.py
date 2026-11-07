import random
import string
import uuid
from datetime import datetime, timezone

from bson import ObjectId

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationAppError
from app.core.ws_manager import order_ws_manager
from app.database import get_db
from app.notifications.service import create_notification
from app.orders.schemas import CreateOrderRequest
from app.payments.service import create_payment_for_order

DELIVERY_FEE = 99.0
SERVICE_FEE_RATE = 0.03

# Forward-only progression. Each key maps to {next_status: allowed_actor_role}.
# Simplified flow: the kitchen accepts (or rejects), then marks the order delivered
# directly — no separate preparing/ready/out-for-delivery steps.
TRANSITIONS: dict[str, dict[str, str]] = {
    "pending": {"accepted": "kitchen_owner", "rejected": "kitchen_owner"},
    "accepted": {"delivered": "kitchen_owner", "cancelled": "kitchen_owner"},
}

# A customer may only cancel while the kitchen hasn't marked the order delivered yet.
CANCELLABLE_STATUSES = {"pending", "accepted"}

STATUS_MESSAGES = {
    "accepted": ("Order accepted!", "The kitchen has accepted your order and is getting it ready."),
    "rejected": ("Order rejected", "Sorry, the kitchen was unable to accept your order."),
    "delivered": ("Delivered", "Enjoy your meal! Don't forget to leave a review."),
    "cancelled": ("Order cancelled", "Your order has been cancelled."),
}


def _generate_order_number() -> str:
    return "AD" + "".join(random.choices(string.digits, k=8))


CHAT_ENABLED_STATUSES = {"accepted", "delivered"}


def serialize_order(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "order_number": doc["order_number"],
        "customer_id": doc["customer_id"],
        "kitchen_id": doc["kitchen_id"],
        "kitchen_name": doc.get("kitchen_name"),
        "can_chat": doc["order_status"] in CHAT_ENABLED_STATUSES,
        "items": doc["items"],
        "subtotal": doc["subtotal"],
        "delivery_fee": doc["delivery_fee"],
        "service_fee": doc["service_fee"],
        "discount": doc["discount"],
        "total": doc["total"],
        "address": doc["address"],
        "payment_method": doc["payment_method"],
        "payment_status": doc["payment_status"],
        "order_status": doc["order_status"],
        "status_history": doc.get("status_history", []),
        "notes": doc.get("notes"),
        "scheduled_for": doc.get("scheduled_for"),
        "cancellation_reason": doc.get("cancellation_reason"),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
    }


async def create_order(customer_id: str, payload: CreateOrderRequest) -> dict:
    db = get_db()

    food = await db.food_items.find_one({"_id": ObjectId(payload.food_id)})
    if not food:
        raise NotFoundError("Food item not found")
    if not food.get("available", True):
        raise ValidationAppError("This item is currently unavailable")

    kitchen = await db.kitchens.find_one({"_id": ObjectId(food["kitchen_id"])})
    if not kitchen:
        raise NotFoundError("Kitchen not found")
    if not kitchen.get("is_open", True) and not payload.scheduled_for:
        raise ValidationAppError("This kitchen is currently closed. You can schedule a pre-order instead.")

    if payload.payment_method in ("easypaisa", "jazzcash", "bank_transfer"):
        configured_method = kitchen.get("payment_details", {}).get("method")
        if payload.payment_method != configured_method:
            raise ValidationAppError("This kitchen doesn't accept that payment method")

    address = await db.addresses.find_one({"_id": ObjectId(payload.address_id), "customer_id": customer_id})
    if not address:
        raise NotFoundError("Delivery address not found")

    extra = sum(
        opt["price_delta"]
        for opt in food.get("customization_options", [])
        if opt["name"] in payload.customizations
    )
    unit_price = round(food["price"] + extra, 2)
    subtotal = round(unit_price * payload.quantity, 2)
    service_fee = round(subtotal * SERVICE_FEE_RATE, 2)
    total = round(subtotal + service_fee + DELIVERY_FEE, 2)

    order_item = {
        "item_id": uuid.uuid4().hex,
        "food_id": payload.food_id,
        "name": food["name"],
        "image": food["images"][0] if food.get("images") else None,
        "price": unit_price,
        "quantity": payload.quantity,
        "customizations": payload.customizations,
        "special_instructions": payload.special_instructions,
    }

    now = datetime.now(timezone.utc)
    order_doc = {
        "_id": ObjectId(),
        "order_number": _generate_order_number(),
        "customer_id": customer_id,
        "kitchen_id": food["kitchen_id"],
        "kitchen_name": kitchen["name"],
        "items": [order_item],
        "subtotal": subtotal,
        "delivery_fee": DELIVERY_FEE,
        "service_fee": service_fee,
        "discount": 0.0,
        "total": total,
        "address": {
            "label": address.get("label"),
            "full_address": address["full_address"],
            "area": address.get("area"),
            "city": address.get("city"),
            "location": address.get("location"),
            "instructions": address.get("instructions"),
        },
        "payment_method": payload.payment_method,
        "payment_status": "pending",
        "order_status": "pending",
        "status_history": [{"status": "pending", "at": now}],
        "notes": payload.notes,
        "scheduled_for": payload.scheduled_for,
        "cancellation_reason": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.orders.insert_one(order_doc)

    await create_payment_for_order(str(order_doc["_id"]), payload.payment_method, total)

    await create_notification(
        kitchen["owner_id"],
        "New order received!",
        f"Order #{order_doc['order_number']} — {order_item['name']}, Rs. {total}",
        "new_order",
        {"order_id": str(order_doc["_id"])},
    )

    if kitchen.get("auto_accept_orders"):
        return await advance_status(str(order_doc["_id"]), "accepted", kitchen["owner_id"], None)

    return serialize_order(order_doc)


async def get_order_or_404(order_id: str) -> dict:
    db = get_db()
    doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not doc:
        raise NotFoundError("Order not found")
    return doc


async def assert_can_view(order: dict, user_id: str, role: str) -> None:
    if role == "admin":
        return
    if role == "customer" and order["customer_id"] == user_id:
        return
    if role == "kitchen_owner":
        db = get_db()
        kitchen = await db.kitchens.find_one({"_id": ObjectId(order["kitchen_id"])})
        if kitchen and kitchen["owner_id"] == user_id:
            return
    raise ForbiddenError("You cannot view this order")


async def advance_status(order_id: str, new_status: str, user_id: str, reason: str | None) -> dict:
    db = get_db()
    order = await get_order_or_404(order_id)

    current = order["order_status"]
    allowed = TRANSITIONS.get(current, {})
    if new_status not in allowed:
        raise ConflictError(f"Cannot move order from '{current}' to '{new_status}'")

    kitchen = await db.kitchens.find_one({"_id": ObjectId(order["kitchen_id"])})
    if not kitchen or kitchen["owner_id"] != user_id:
        raise ForbiddenError("You do not manage this kitchen")

    now = datetime.now(timezone.utc)
    update: dict = {
        "order_status": new_status,
        "updated_at": now,
    }
    if new_status == "rejected":
        update["cancellation_reason"] = reason or "Rejected by kitchen"
    elif new_status == "cancelled":
        update["cancellation_reason"] = reason or "Cancelled by kitchen"

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update, "$push": {"status_history": {"status": new_status, "at": now}}},
    )

    updated = await db.orders.find_one({"_id": ObjectId(order_id)})

    if new_status == "delivered":
        # Kitchen keeps the food subtotal; the platform keeps delivery + service fees.
        await db.kitchen_earnings.insert_one(
            {
                "_id": ObjectId(),
                "kitchen_id": order["kitchen_id"],
                "order_id": order_id,
                "order_number": order["order_number"],
                "amount": order["subtotal"],
                "created_at": now,
            }
        )

    title, body = STATUS_MESSAGES.get(new_status, (new_status, ""))
    await create_notification(
        order["customer_id"], title, f"Order #{order['order_number']}: {body}", "order_status", {"order_id": order_id}
    )

    await order_ws_manager.broadcast(
        order_id, {"type": "order_status", "order_id": order_id, "status": new_status, "at": now.isoformat()}
    )

    return serialize_order(updated)


async def cancel_order(order_id: str, customer_id: str, reason: str | None) -> dict:
    db = get_db()
    order = await get_order_or_404(order_id)

    if order["customer_id"] != customer_id:
        raise ForbiddenError("You cannot cancel this order")
    if order["order_status"] not in CANCELLABLE_STATUSES:
        raise ConflictError("This order can no longer be cancelled")

    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {"order_status": "cancelled", "cancellation_reason": reason, "updated_at": now},
            "$push": {"status_history": {"status": "cancelled", "at": now}},
        },
    )
    updated = await db.orders.find_one({"_id": ObjectId(order_id)})

    kitchen = await db.kitchens.find_one({"_id": ObjectId(order["kitchen_id"])})
    if kitchen:
        await create_notification(
            kitchen["owner_id"],
            "Order cancelled",
            f"Order #{order['order_number']} was cancelled by the customer.",
            "order_cancelled",
            {"order_id": order_id},
        )

    await order_ws_manager.broadcast(
        order_id, {"type": "order_status", "order_id": order_id, "status": "cancelled", "at": now.isoformat()}
    )

    return serialize_order(updated)
