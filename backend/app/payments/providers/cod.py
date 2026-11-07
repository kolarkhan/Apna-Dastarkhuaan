import uuid
from typing import Any

from app.payments.providers.base import PaymentProvider


class CashOnDeliveryProvider(PaymentProvider):
    name = "cod"

    async def create_payment(self, order_id: str, amount: float) -> dict[str, Any]:
        return {
            "status": "pending",  # collected by the delivery rider on drop-off
            "provider_reference": f"cod_{uuid.uuid4().hex[:12]}",
            "client_data": None,
        }

    async def verify_payment(self, provider_reference: str) -> str:
        return "pending"

    async def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"provider_reference": payload.get("provider_reference", ""), "status": "pending"}
