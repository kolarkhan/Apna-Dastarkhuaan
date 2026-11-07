from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    order_id: str
    food_id: str | None = None
    food_rating: int = Field(ge=1, le=5)
    kitchen_rating: int = Field(ge=1, le=5)
    delivery_rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)
