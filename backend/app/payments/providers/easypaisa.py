import uuid
from typing import Any

from app.config import get_settings
from app.payments.providers.base import PaymentProvider

settings = get_settings()


class EasypaisaProvider(PaymentProvider):
    """Mobile-account payment via Easypaisa.

    TODO(production): replace the mock create/verify calls below with real requests to
    Easypaisa's merchant API using settings.easypaisa_merchant_id / easypaisa_secret,
    and validate `handle_webhook` payloads against their signature scheme.
    """

    name = "easypaisa"

    async def create_payment(self, order_id: str, amount: float) -> dict[str, Any]:
        if not settings.easypaisa_merchant_id:
            # Sandbox mode: simulate an initiated mobile-account payment.
            return {
                "status": "pending",
                "provider_reference": f"easypaisa_sandbox_{uuid.uuid4().hex[:12]}",
                "client_data": {"mode": "sandbox", "instructions": "Approve the payment in your Easypaisa app."},
            }
        raise NotImplementedError("Real Easypaisa merchant integration not yet configured")

    async def verify_payment(self, provider_reference: str) -> str:
        if provider_reference.startswith("easypaisa_sandbox_"):
            return "paid"
        raise NotImplementedError("Real Easypaisa verification not yet configured")

    async def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"provider_reference": payload.get("provider_reference", ""), "status": payload.get("status", "pending")}
