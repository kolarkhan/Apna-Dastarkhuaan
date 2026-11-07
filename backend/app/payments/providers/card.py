import uuid
from typing import Any

from app.config import get_settings
from app.payments.providers.base import PaymentProvider

settings = get_settings()


class CardProvider(PaymentProvider):
    """Card payments (Stripe-shaped: create a PaymentIntent, confirm client-side).

    TODO(production): replace with real Stripe (or a local acquirer) calls using
    settings.stripe_secret_key, and verify webhook signatures.
    """

    name = "card"

    async def create_payment(self, order_id: str, amount: float) -> dict[str, Any]:
        if not settings.stripe_secret_key:
            return {
                "status": "pending",
                "provider_reference": f"card_sandbox_{uuid.uuid4().hex[:12]}",
                "client_data": {"mode": "sandbox", "client_secret": f"sandbox_secret_{uuid.uuid4().hex[:8]}"},
            }
        raise NotImplementedError("Real card processor integration not yet configured")

    async def verify_payment(self, provider_reference: str) -> str:
        if provider_reference.startswith("card_sandbox_"):
            return "paid"
        raise NotImplementedError("Real card verification not yet configured")

    async def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"provider_reference": payload.get("provider_reference", ""), "status": payload.get("status", "pending")}
