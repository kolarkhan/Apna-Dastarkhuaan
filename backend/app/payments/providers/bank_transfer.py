import uuid
from typing import Any

from app.payments.providers.base import PaymentProvider


class BankTransferProvider(PaymentProvider):
    """Direct bank transfer to the kitchen's own account (see Kitchen.payment_details).

    There's no gateway here — the customer transfers manually and the kitchen confirms
    receipt, so this settles the same way COD does rather than auto-verifying.
    """

    name = "bank_transfer"

    async def create_payment(self, order_id: str, amount: float) -> dict[str, Any]:
        return {
            "status": "pending",  # confirmed by the kitchen once the transfer arrives
            "provider_reference": f"bank_transfer_{uuid.uuid4().hex[:12]}",
            "client_data": None,
        }

    async def verify_payment(self, provider_reference: str) -> str:
        return "pending"

    async def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"provider_reference": payload.get("provider_reference", ""), "status": "pending"}
