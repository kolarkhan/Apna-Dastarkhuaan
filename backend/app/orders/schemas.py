from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PaymentMethod = Literal["cod", "easypaisa", "jazzcash", "card", "bank_transfer"]

KitchenAdvanceStatus = Literal["accepted", "rejected", "delivered", "cancelled"]


class CreateOrderRequest(BaseModel):
    food_id: str
    quantity: int = Field(default=1, ge=1, le=20)
    customizations: list[str] = Field(default_factory=list)
    special_instructions: str | None = Field(default=None, max_length=200)
    address_id: str
    payment_method: PaymentMethod = "cod"
    notes: str | None = Field(default=None, max_length=300)
    scheduled_for: datetime | None = None  # None = ASAP; future datetime = pre-order


class UpdateOrderStatusRequest(BaseModel):
    status: KitchenAdvanceStatus
    reason: str | None = Field(default=None, max_length=300)  # required in practice for "rejected"


class CancelOrderRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=300)
