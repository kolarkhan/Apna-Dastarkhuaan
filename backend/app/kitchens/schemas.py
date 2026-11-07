from typing import Literal

from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    lat: float
    lng: float


class BusinessHourEntry(BaseModel):
    day: str  # monday, tuesday, ...
    open_time: str = "09:00"
    close_time: str = "22:00"
    closed: bool = False


class CreateKitchenRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=10, max_length=1000)
    address: str = Field(min_length=4, max_length=200)
    location: GeoPoint
    cuisine_tags: list[str] = Field(default_factory=list)
    business_hours: list[BusinessHourEntry] = Field(default_factory=list)


class PaymentDetails(BaseModel):
    """A kitchen accepts exactly one non-cash, non-card payment method at a time —
    whichever the owner currently has selected."""

    method: Literal["easypaisa", "jazzcash", "bank_transfer"] | None = None
    account_title: str | None = Field(default=None, max_length=100)
    account_number: str | None = Field(default=None, max_length=40)  # wallet number, or bank account/IBAN
    bank_name: str | None = Field(default=None, max_length=100)  # only meaningful when method == "bank_transfer"


class UpdateKitchenRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    address: str | None = None
    location: GeoPoint | None = None
    cuisine_tags: list[str] | None = None
    payment_details: PaymentDetails | None = None
    auto_accept_orders: bool | None = None


class UpdateBusinessHoursRequest(BaseModel):
    business_hours: list[BusinessHourEntry]
