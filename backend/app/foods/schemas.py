from typing import Literal

from pydantic import BaseModel, Field

SpiceLevel = Literal["mild", "medium", "spicy"]


class CustomizationOption(BaseModel):
    name: str
    price_delta: float = 0.0


class CreateFoodRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=5, max_length=1000)
    price: float = Field(gt=0)
    category_id: str
    ingredients: list[str] = Field(default_factory=list)
    portion: str = "1 person"
    preparation_time_minutes: int = Field(default=30, ge=1, le=300)
    spice_level: SpiceLevel = "medium"
    customization_options: list[CustomizationOption] = Field(default_factory=list)
    available: bool = True


class UpdateFoodRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    category_id: str | None = None
    ingredients: list[str] | None = None
    portion: str | None = None
    preparation_time_minutes: int | None = None
    spice_level: SpiceLevel | None = None
    customization_options: list[CustomizationOption] | None = None
    available: bool | None = None
