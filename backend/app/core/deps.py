from typing import Annotated

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, id: str, role: str):
        self.id = id
        self.role = role


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    if credentials is None:
        raise UnauthorizedError("Missing authentication token")

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")

    user_id = payload.get("sub")
    role = payload.get("role")
    if not user_id or not role:
        raise UnauthorizedError("Invalid token payload")

    try:
        ObjectId(user_id)
    except InvalidId as exc:
        raise UnauthorizedError("Invalid token payload") from exc

    # Confirm the user still exists and isn't suspended — never trust the JWT claims alone.
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"role": 1, "status": 1})
    if user is None:
        raise UnauthorizedError("User no longer exists")
    if user.get("status") in ("suspended", "deleted"):
        raise ForbiddenError("Your account has been suspended")

    # Role comes from the DB record, not the (possibly stale) token, so admin role changes take effect immediately.
    return CurrentUser(id=user_id, role=user.get("role", role))


def require_role(*allowed_roles: str):
    async def _check(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise ForbiddenError("You do not have permission to do this")
        return current_user

    return _check
