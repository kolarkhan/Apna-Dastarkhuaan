from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    icon: str | None = None  # emoji or icon name rendered by the client
    image: str | None = None


class UpdateCategoryRequest(BaseModel):
    name: str | None = None
    icon: str | None = None
    image: str | None = None
