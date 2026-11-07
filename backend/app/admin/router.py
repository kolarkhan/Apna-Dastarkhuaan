from datetime import datetime, time, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.admin.schemas import BroadcastNotificationRequest, RejectKitchenRequest, SuspendUserRequest
from app.auth.service import serialize_user
from app.core.deps import require_role
from app.core.exceptions import NotFoundError
from app.core.pagination import PageParams, build_paged_response, page_params
from app.database import get_db
from app.foods.router import serialize_food
from app.kitchens.router import serialize_kitchen
from app.notifications.service import create_notification
from app.orders.service import serialize_order
from app.reviews.router import serialize_review

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


@router.get("/stats")
async def dashboard_stats():
    db = get_db()
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)

    total_customers = await db.users.count_documents({"role": "customer"})
    total_kitchens = await db.kitchens.count_documents({})
    verified_kitchens = await db.kitchens.count_documents({"verified": True})
    pending_kitchen_approvals = await db.kitchens.count_documents({"status": "pending"})
    total_orders = await db.orders.count_documents({})
    today_orders = await db.orders.count_documents({"created_at": {"$gte": today_start}})
    active_orders = await db.orders.count_documents({"order_status": {"$in": ["pending", "accepted"]}})

    revenue_pipeline = [
        {"$match": {"order_status": "delivered"}},
        {"$group": {"_id": None, "revenue": {"$sum": {"$add": ["$delivery_fee", "$service_fee"]}}, "gmv": {"$sum": "$total"}}},
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)

    return {
        "total_customers": total_customers,
        "total_kitchens": total_kitchens,
        "verified_kitchens": verified_kitchens,
        "pending_kitchen_approvals": pending_kitchen_approvals,
        "total_orders": total_orders,
        "today_orders": today_orders,
        "active_orders": active_orders,
        "platform_revenue": revenue_result[0]["revenue"] if revenue_result else 0.0,
        "gross_merchandise_value": revenue_result[0]["gmv"] if revenue_result else 0.0,
    }


@router.get("/customers")
async def list_customers(params: Annotated[PageParams, Depends(page_params)], search: str | None = None):
    db = get_db()
    match: dict = {"role": "customer"}
    if search:
        match["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    total = await db.users.count_documents(match)
    cursor = db.users.find(match).sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [serialize_user(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.patch("/users/{user_id}/suspend")
async def suspend_user(user_id: str, payload: SuspendUserRequest):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": "suspended", "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise NotFoundError("User not found")
    await create_notification(
        user_id,
        "Account suspended",
        payload.reason or "Your account has been suspended. Contact support for details.",
        "account_status",
    )
    return {"message": "User suspended"}


@router.patch("/users/{user_id}/unsuspend")
async def unsuspend_user(user_id: str):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise NotFoundError("User not found")
    await create_notification(user_id, "Account reinstated", "Your account is active again. Welcome back!", "account_status")
    return {"message": "User reinstated"}


@router.get("/kitchens")
async def list_kitchens_admin(
    params: Annotated[PageParams, Depends(page_params)],
    status_filter: str | None = None,
):
    db = get_db()
    match: dict = {}
    if status_filter:
        match["status"] = status_filter
    total = await db.kitchens.count_documents(match)
    cursor = db.kitchens.find(match).sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [serialize_kitchen(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.patch("/kitchens/{kitchen_id}/approve")
async def approve_kitchen(kitchen_id: str):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)}, {"$set": {"status": "approved", "updated_at": now}}
    )
    if result.matched_count == 0:
        raise NotFoundError("Kitchen not found")

    kitchen = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    await create_notification(
        kitchen["owner_id"], "Kitchen approved!", f"'{kitchen['name']}' is now live on Apna Dastarkhuaan.", "kitchen_status"
    )
    return serialize_kitchen(kitchen)


@router.patch("/kitchens/{kitchen_id}/reject")
async def reject_kitchen(kitchen_id: str, payload: RejectKitchenRequest):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)},
        {"$set": {"status": "rejected", "rejection_reason": payload.reason, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise NotFoundError("Kitchen not found")

    kitchen = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    await create_notification(
        kitchen["owner_id"], "Kitchen application rejected", payload.reason, "kitchen_status"
    )
    return serialize_kitchen(kitchen)


@router.patch("/kitchens/{kitchen_id}/verify")
async def verify_kitchen(kitchen_id: str):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)}, {"$set": {"verified": True, "updated_at": now}}
    )
    if result.matched_count == 0:
        raise NotFoundError("Kitchen not found")

    kitchen = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    await create_notification(
        kitchen["owner_id"], "You're verified!", f"'{kitchen['name']}' now shows the Verified Kitchen badge.", "kitchen_status"
    )
    return serialize_kitchen(kitchen)


@router.patch("/kitchens/{kitchen_id}/suspend")
async def suspend_kitchen(kitchen_id: str, payload: SuspendUserRequest):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)},
        {"$set": {"status": "suspended", "is_open": False, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise NotFoundError("Kitchen not found")
    kitchen = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    await create_notification(
        kitchen["owner_id"],
        "Kitchen suspended",
        payload.reason or f"'{kitchen['name']}' has been suspended and is no longer visible to customers.",
        "kitchen_status",
    )
    return serialize_kitchen(kitchen)


@router.patch("/kitchens/{kitchen_id}/unsuspend")
async def unsuspend_kitchen(kitchen_id: str):
    db = get_db()
    now = datetime.now(timezone.utc)
    result = await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)}, {"$set": {"status": "approved", "updated_at": now}}
    )
    if result.matched_count == 0:
        raise NotFoundError("Kitchen not found")
    kitchen = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    await create_notification(
        kitchen["owner_id"],
        "Kitchen reinstated",
        f"'{kitchen['name']}' is visible to customers again. You can reopen for orders anytime.",
        "kitchen_status",
    )
    return serialize_kitchen(kitchen)


@router.get("/foods")
async def list_foods_admin(params: Annotated[PageParams, Depends(page_params)]):
    db = get_db()
    total = await db.food_items.count_documents({})
    cursor = db.food_items.find().sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [serialize_food(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.delete("/foods/{food_id}", status_code=204)
async def remove_food_admin(food_id: str):
    db = get_db()
    result = await db.food_items.delete_one({"_id": ObjectId(food_id)})
    if result.deleted_count == 0:
        raise NotFoundError("Food item not found")


@router.get("/orders")
async def list_orders_admin(params: Annotated[PageParams, Depends(page_params)], status_filter: str | None = None):
    db = get_db()
    match: dict = {}
    if status_filter:
        match["order_status"] = status_filter
    total = await db.orders.count_documents(match)
    cursor = db.orders.find(match).sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [serialize_order(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.get("/reviews")
async def list_reviews_admin(params: Annotated[PageParams, Depends(page_params)]):
    db = get_db()
    total = await db.reviews.count_documents({})
    cursor = db.reviews.find().sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [serialize_review(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.delete("/reviews/{review_id}", status_code=204)
async def remove_review_admin(review_id: str):
    """Used to handle reported/inappropriate review content."""
    db = get_db()
    result = await db.reviews.delete_one({"_id": ObjectId(review_id)})
    if result.deleted_count == 0:
        raise NotFoundError("Review not found")


@router.get("/payments")
async def list_payments_admin(params: Annotated[PageParams, Depends(page_params)]):
    db = get_db()
    total = await db.payments.count_documents({})
    cursor = db.payments.find().sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [
        {
            "order_id": d["order_id"],
            "method": d["method"],
            "amount": d["amount"],
            "status": d["status"],
            "created_at": d["created_at"],
        }
        async for d in cursor
    ]
    return build_paged_response(items, total, params)


@router.post("/notifications/broadcast")
async def broadcast_notification(payload: BroadcastNotificationRequest):
    db = get_db()
    match: dict = {}
    if payload.audience == "customers":
        match["role"] = "customer"
    elif payload.audience == "kitchen_owners":
        match["role"] = "kitchen_owner"

    user_ids = [str(u["_id"]) async for u in db.users.find(match, {"_id": 1})]
    for user_id in user_ids:
        await create_notification(user_id, payload.title, payload.body, "announcement")

    return {"message": f"Notification sent to {len(user_ids)} user(s)"}
