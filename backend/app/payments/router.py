from typing import Annotated, Any

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, get_current_user
from app.core.exceptions import ForbiddenError, NotFoundError
from app.database import get_db
from app.payments import service

router = APIRouter(prefix="/payments", tags=["payments"])


def _serialize(doc: dict) -> dict:
    return {
        "order_id": doc["order_id"],
        "method": doc["method"],
        "amount": doc["amount"],
        "status": doc["status"],
        "provider_reference": doc["provider_reference"],
        "client_data": doc.get("client_data"),
    }


async def _assert_order_access(order_id: str, current_user: CurrentUser) -> None:
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise NotFoundError("Order not found")
    if current_user.role == "admin":
        return
    if order["customer_id"] != current_user.id:
        raise ForbiddenError("You cannot view this payment")


@router.get("/{order_id}")
async def get_payment(order_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    await _assert_order_access(order_id, current_user)
    doc = await service.get_payment_for_order(order_id)
    return _serialize(doc)


@router.post("/{order_id}/verify")
async def verify_payment(order_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    await _assert_order_access(order_id, current_user)
    doc = await service.verify_payment_for_order(order_id)
    return _serialize(doc)


@router.post("/webhook/{provider_name}")
async def payment_webhook(provider_name: str, payload: dict[str, Any]):
    """Receives async payment confirmations from a gateway. Not authenticated the same
    way as user routes — production would verify the provider's signature here."""
    provider = service.get_payment_provider(provider_name)
    normalized = await provider.handle_webhook(payload)

    db = get_db()
    payment = await db.payments.find_one({"provider_reference": normalized["provider_reference"]})
    if payment:
        await db.payments.update_one({"_id": payment["_id"]}, {"$set": {"status": normalized["status"]}})
        if normalized["status"] == "paid":
            await db.orders.update_one(
                {"_id": ObjectId(payment["order_id"])}, {"$set": {"payment_status": "paid"}}
            )
    return {"received": True}
