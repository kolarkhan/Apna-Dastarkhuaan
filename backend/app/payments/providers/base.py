from abc import ABC, abstractmethod
from typing import Any


class PaymentProvider(ABC):
    """Every payment method (COD, Easypaisa, JazzCash, Card, ...) implements this.

    Routers and the orders service only ever talk to this interface, never to a
    concrete provider, so a new payment method is a new class + a factory entry —
    never a change to checkout/order code.
    """

    name: str

    @abstractmethod
    async def create_payment(self, order_id: str, amount: float) -> dict[str, Any]:
        """Initiate payment for an order. Returns {status, provider_reference, client_data}."""
        raise NotImplementedError

    @abstractmethod
    async def verify_payment(self, provider_reference: str) -> str:
        """Returns the current status: pending | paid | failed."""
        raise NotImplementedError

    @abstractmethod
    async def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Normalizes a provider webhook payload into {provider_reference, status}."""
        raise NotImplementedError
