from typing import Literal

from pydantic import BaseModel, Field


class RejectKitchenRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=300)


class SuspendUserRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=300)


class BroadcastNotificationRequest(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    body: str = Field(min_length=2, max_length=300)
    audience: Literal["all", "customers", "kitchen_owners"] = "all"
