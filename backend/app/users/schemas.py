from pydantic import BaseModel, EmailStr, Field


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    avatar: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UpdateNotificationPreferencesRequest(BaseModel):
    order_updates: bool
    chat_messages: bool
    announcements: bool


class DeleteAccountRequest(BaseModel):
    password: str
