from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    lat: float
    lng: float


class CreateAddressRequest(BaseModel):
    label: str = Field(default="Home", max_length=40)  # Home, Work, Other
    full_address: str = Field(min_length=4, max_length=200)
    area: str | None = None
    city: str | None = None
    location: GeoPoint | None = None
    is_default: bool = False
    instructions: str | None = Field(default=None, max_length=200)


class UpdateAddressRequest(BaseModel):
    label: str | None = None
    full_address: str | None = None
    area: str | None = None
    city: str | None = None
    location: GeoPoint | None = None
    is_default: bool | None = None
    instructions: str | None = None
