from datetime import datetime, time, timezone
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_role
from app.core.exceptions import NotFoundError
from app.core.pagination import PageParams, build_paged_response, page_params
from app.database import get_db

router = APIRouter(prefix="/kitchen-earnings", tags=["kitchen-earnings"])


async def _my_kitchen_id(current_user: CurrentUser) -> str:
    db = get_db()
    kitchen = await db.kitchens.find_one({"owner_id": current_user.id})
    if not kitchen:
        raise NotFoundError("You haven't created a kitchen yet")
    return str(kitchen["_id"])


@router.get("/summary")
async def earnings_summary(current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))]):
    db = get_db()
    kitchen_id = await _my_kitchen_id(current_user)

    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)

    total_pipeline = [{"$match": {"kitchen_id": kitchen_id}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    today_pipeline = [
        {"$match": {"kitchen_id": kitchen_id, "created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
    ]

    total_result = await db.kitchen_earnings.aggregate(total_pipeline).to_list(1)
    today_result = await db.kitchen_earnings.aggregate(today_pipeline).to_list(1)

    pending_orders = await db.orders.count_documents({"kitchen_id": kitchen_id, "order_status": "pending"})
    active_orders = await db.orders.count_documents({"kitchen_id": kitchen_id, "order_status": "accepted"})
    completed_orders = await db.orders.count_documents({"kitchen_id": kitchen_id, "order_status": "delivered"})
    today_orders = await db.orders.count_documents({"kitchen_id": kitchen_id, "created_at": {"$gte": today_start}})

    popular_pipeline = [
        {"$match": {"kitchen_id": kitchen_id, "order_status": "delivered"}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "quantity": {"$sum": "$items.quantity"}}},
        {"$sort": {"quantity": -1}},
        {"$limit": 5},
    ]
    popular_foods = [
        {"name": d["_id"], "quantity": d["quantity"]} async for d in db.orders.aggregate(popular_pipeline)
    ]

    return {
        "today_sales": today_result[0]["total"] if today_result else 0.0,
        "today_orders": today_orders,
        "total_earnings": total_result[0]["total"] if total_result else 0.0,
        "pending_orders": pending_orders,
        "active_orders": active_orders,
        "completed_orders": completed_orders,
        "popular_foods": popular_foods,
    }


@router.get("/history")
async def earnings_history(
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
    params: Annotated[PageParams, Depends(page_params)],
):
    db = get_db()
    kitchen_id = await _my_kitchen_id(current_user)

    match = {"kitchen_id": kitchen_id}
    total = await db.kitchen_earnings.count_documents(match)
    cursor = db.kitchen_earnings.find(match).sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [
        {
            "order_id": d["order_id"],
            "order_number": d["order_number"],
            "amount": d["amount"],
            "created_at": d["created_at"],
        }
        async for d in cursor
    ]
    return build_paged_response(items, total, params)
