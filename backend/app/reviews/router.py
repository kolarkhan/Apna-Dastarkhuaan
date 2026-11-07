from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_role
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationAppError
from app.core.pagination import PageParams, build_paged_response, page_params
from app.database import get_db
from app.reviews.schemas import CreateReviewRequest

router = APIRouter(prefix="/reviews", tags=["reviews"])


def serialize_review(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "order_id": doc["order_id"],
        "kitchen_id": doc["kitchen_id"],
        "food_id": doc.get("food_id"),
        "customer_id": doc["customer_id"],
        "customer_name": doc.get("customer_name"),
        "food_rating": doc["food_rating"],
        "kitchen_rating": doc["kitchen_rating"],
        "delivery_rating": doc["delivery_rating"],
        "comment": doc.get("comment"),
        "created_at": doc["created_at"],
    }


async def _recompute_rating(collection_name: str, field_id: str, target_field: str) -> None:
    db = get_db()
    collection = db[collection_name]
    pipeline = [
        {"$match": {target_field: field_id}},
        {"$group": {"_id": None, "avg": {"$avg": f"${'kitchen_rating' if target_field == 'kitchen_id' else 'food_rating'}"}, "count": {"$sum": 1}}},
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if result:
        await collection.update_one(
            {"_id": ObjectId(field_id)},
            {"$set": {"rating": round(result[0]["avg"], 2), "review_count": result[0]["count"]}},
        )


@router.post("", status_code=201)
async def create_review(
    payload: CreateReviewRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("customer"))],
):
    db = get_db()

    order = await db.orders.find_one({"_id": ObjectId(payload.order_id)})
    if not order:
        raise NotFoundError("Order not found")
    if order["customer_id"] != current_user.id:
        raise ForbiddenError("You cannot review this order")
    if order["order_status"] != "delivered":
        raise ValidationAppError("You can only review orders after they've been delivered")

    if await db.reviews.find_one({"order_id": payload.order_id}):
        raise ConflictError("You already reviewed this order")

    customer = await db.users.find_one({"_id": ObjectId(current_user.id)})

    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "order_id": payload.order_id,
        "kitchen_id": order["kitchen_id"],
        "food_id": payload.food_id,
        "customer_id": current_user.id,
        "customer_name": customer["name"] if customer else "Customer",
        "food_rating": payload.food_rating,
        "kitchen_rating": payload.kitchen_rating,
        "delivery_rating": payload.delivery_rating,
        "comment": payload.comment,
        "created_at": now,
    }
    await db.reviews.insert_one(doc)

    await _recompute_rating("kitchens", order["kitchen_id"], "kitchen_id")
    if payload.food_id:
        await _recompute_rating("food_items", payload.food_id, "food_id")

    return serialize_review(doc)


@router.get("")
async def list_reviews(
    params: Annotated[PageParams, Depends(page_params)],
    kitchen_id: str | None = None,
    food_id: str | None = None,
):
    db = get_db()
    match: dict = {}
    if kitchen_id:
        match["kitchen_id"] = kitchen_id
    if food_id:
        match["food_id"] = food_id

    total = await db.reviews.count_documents(match)
    cursor = db.reviews.find(match).sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [serialize_review(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.get("/mine")
async def my_reviews(current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    db = get_db()
    cursor = db.reviews.find({"customer_id": current_user.id}).sort("created_at", -1)
    return [serialize_review(d) async for d in cursor]
