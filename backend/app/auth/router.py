from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import service
from app.auth.schemas import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserPublic,
)
from app.core.deps import CurrentUser, get_current_user
from app.database import get_db
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest):
    return await service.register_user(payload)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    return await service.login_user(payload)


@router.post("/refresh")
async def refresh(payload: RefreshRequest):
    return await service.refresh_tokens(payload.refresh_token)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    reset_token = await service.request_password_reset(payload.email)
    response = {"message": "If that email exists, a reset link has been sent."}
    if reset_token:
        # Dev convenience: since no email provider is wired up yet, surface the token directly.
        response["dev_reset_token"] = reset_token
    return response


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    await service.reset_password(payload)
    return {"message": "Password has been reset. You can now log in."}


@router.get("/me", response_model=UserPublic)
async def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return service.serialize_user(user)
