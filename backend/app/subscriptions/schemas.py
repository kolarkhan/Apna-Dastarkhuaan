from typing import Literal

from pydantic import BaseModel


class SubscribeRequest(BaseModel):
    payment_method: Literal["easypaisa", "bank_transfer", "card"]
