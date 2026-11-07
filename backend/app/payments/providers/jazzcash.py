import uuid
from typing import Any

from app.config import get_settings
from app.payments.providers.base import PaymentProvider

settings = get_settings()


class JazzCashProvider(PaymentProvider):
    """Mobile-account payment via JazzCash.

    TODO(production): replace the mock calls below with JazzCash's Mobile Wallet /
    Hosted Checkout API using settings.jazzcash_merchant_id / jazzcash_secret, and
    verify the secure hash on incoming webhooks.
    """

    name = "jazzcash"

    async def create_payment(self, order_id: str, amount: float) -> dict[str, Any]:
        if not settings.jazzcash_merchant_id:
            return {
                "status": "pending",
                "provider_reference": f"jazzcash_sandbox_{uuid.uuid4().hex[:12]}",
                "client_data": {"mode": "sandbox", "instructions": "Approve the payment in your JazzCash app."},
            }
        raise NotImplementedError("Real JazzCash merchant integration not yet configured")

    async def verify_payment(self, provider_reference: str) -> str:
        if provider_reference.startswith("jazzcash_sandbox_"):
            return "paid"
        raise NotImplementedError("Real JazzCash verification not yet configured")

    async def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"provider_reference": payload.get("provider_reference", ""), "status": payload.get("status", "pending")}
