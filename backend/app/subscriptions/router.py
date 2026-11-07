import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_role
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.subscriptions.schemas import SubscribeRequest
from app.subscriptions.service import PLANS, PRO_PLAN_PRICE, SUBSCRIPTION_DURATION_DAYS, is_pro

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"], dependencies=[Depends(require_role("kitchen_owner"))])

METHOD_LABELS = {"easypaisa": "Easypaisa", "bank_transfer": "Bank Transfer", "card": "Card"}


async def _my_kitchen(current_user: CurrentUser) -> dict:
    db = get_db()
    kitchen = await db.kitchens.find_one({"owner_id": current_user.id})
    if not kitchen:
        raise NotFoundError("You haven't created a kitchen yet")
    return kitchen


def _serialize_status(kitchen: dict) -> dict:
    pro = is_pro(kitchen)
    return {
        "plan": "pro" if pro else "free",
        "expires_at": kitchen.get("subscription_expires_at") if pro else None,
    }


@router.get("/plans")
async def list_plans():
    return PLANS


@router.get("/me")
async def my_subscription(current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))]):
    kitchen = await _my_kitchen(current_user)
    db = get_db()

    # Lazily correct the stored plan once it's actually expired, so listing priority
    # and future reads reflect reality without needing a background job.
    if kitchen.get("subscription_plan") == "pro" and not is_pro(kitchen):
        await db.kitchens.update_one(
            {"_id": kitchen["_id"]},
            {"$set": {"subscription_plan": "free", "subscription_expires_at": None, "updated_at": datetime.now(timezone.utc)}},
        )
        kitchen["subscription_plan"] = "free"
        kitchen["subscription_expires_at"] = None

    return _serialize_status(kitchen)


@router.post("/subscribe")
async def subscribe(
    payload: SubscribeRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    db = get_db()
    kitchen = await _my_kitchen(current_user)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=SUBSCRIPTION_DURATION_DAYS)

    await db.kitchens.update_one(
        {"_id": kitchen["_id"]},
        {"$set": {"subscription_plan": "pro", "subscription_expires_at": expires_at, "updated_at": now}},
    )
    await db.subscription_payments.insert_one(
        {
            "_id": ObjectId(),
            "kitchen_id": str(kitchen["_id"]),
            "plan": "pro",
            "amount": PRO_PLAN_PRICE,
            "method": payload.payment_method,
            "provider_reference": f"{payload.payment_method}_sandbox_{uuid.uuid4().hex[:12]}",
            "expires_at": expires_at,
            "created_at": now,
        }
    )

    return {
        "plan": "pro",
        "expires_at": expires_at,
        "message": f"You're now on Pro Kitchen! Paid Rs. {PRO_PLAN_PRICE:,.0f} via {METHOD_LABELS[payload.payment_method]}.",
    }


@router.post("/cancel")
async def cancel_subscription(current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))]):
    db = get_db()
    kitchen = await _my_kitchen(current_user)
    await db.kitchens.update_one(
        {"_id": kitchen["_id"]},
        {"$set": {"subscription_plan": "free", "subscription_expires_at": None, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"plan": "free", "expires_at": None, "message": "You've moved back to the Free plan."}
