from datetime import datetime, timezone

from bson import ObjectId

from app.core.exceptions import NotFoundError, ValidationAppError
from app.database import get_db
from app.payments.providers.bank_transfer import BankTransferProvider
from app.payments.providers.base import PaymentProvider
from app.payments.providers.card import CardProvider
from app.payments.providers.cod import CashOnDeliveryProvider
from app.payments.providers.easypaisa import EasypaisaProvider
from app.payments.providers.jazzcash import JazzCashProvider

_PROVIDERS: dict[str, PaymentProvider] = {
    "cod": CashOnDeliveryProvider(),
    "easypaisa": EasypaisaProvider(),
    "jazzcash": JazzCashProvider(),
    "card": CardProvider(),
    "bank_transfer": BankTransferProvider(),
}


def get_payment_provider(method: str) -> PaymentProvider:
    provider = _PROVIDERS.get(method)
    if provider is None:
        raise ValidationAppError(f"Unsupported payment method: {method}")
    return provider


async def create_payment_for_order(order_id: str, method: str, amount: float) -> dict:
    provider = get_payment_provider(method)
    result = await provider.create_payment(order_id, amount)

    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "order_id": order_id,
        "method": method,
        "amount": amount,
        "status": result["status"],
        "provider_reference": result["provider_reference"],
        "client_data": result.get("client_data"),
        "created_at": now,
        "updated_at": now,
    }
    await db.payments.insert_one(doc)
    return doc


async def get_payment_for_order(order_id: str) -> dict:
    db = get_db()
    doc = await db.payments.find_one({"order_id": order_id})
    if not doc:
        raise NotFoundError("Payment record not found")
    return doc


async def verify_payment_for_order(order_id: str) -> dict:
    db = get_db()
    payment = await get_payment_for_order(order_id)
    provider = get_payment_provider(payment["method"])
    status = await provider.verify_payment(payment["provider_reference"])

    await db.payments.update_one(
        {"_id": payment["_id"]}, {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
    )
    if status == "paid":
        await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"payment_status": "paid"}})

    payment["status"] = status
    return payment
