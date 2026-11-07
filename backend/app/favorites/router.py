from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_role
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.foods.router import serialize_food
from app.kitchens.router import serialize_kitchen

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/kitchens")
async def list_favorite_kitchens(current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    db = get_db()
    fav_ids = [
        f["kitchen_id"]
        async for f in db.favorites.find({"customer_id": current_user.id, "kitchen_id": {"$ne": None}})
    ]
    if not fav_ids:
        return []
    cursor = db.kitchens.find({"_id": {"$in": [ObjectId(i) for i in fav_ids]}})
    return [serialize_kitchen(d) async for d in cursor]


@router.post("/kitchens/{kitchen_id}", status_code=201)
async def favorite_kitchen(kitchen_id: str, current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    db = get_db()
    if not await db.kitchens.find_one({"_id": ObjectId(kitchen_id)}):
        raise NotFoundError("Kitchen not found")

    await db.favorites.update_one(
        {"customer_id": current_user.id, "kitchen_id": kitchen_id},
        {"$setOnInsert": {"_id": ObjectId(), "created_at": datetime.now(timezone.utc), "food_id": None}},
        upsert=True,
    )
    return {"favorited": True}


@router.delete("/kitchens/{kitchen_id}", status_code=204)
async def unfavorite_kitchen(kitchen_id: str, current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    db = get_db()
    await db.favorites.delete_one({"customer_id": current_user.id, "kitchen_id": kitchen_id})


@router.get("/foods")
async def list_favorite_foods(current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    db = get_db()
    fav_ids = [
        f["food_id"] async for f in db.favorites.find({"customer_id": current_user.id, "food_id": {"$ne": None}})
    ]
    if not fav_ids:
        return []
    cursor = db.food_items.find({"_id": {"$in": [ObjectId(i) for i in fav_ids]}})
    return [serialize_food(d) async for d in cursor]


@router.post("/foods/{food_id}", status_code=201)
async def favorite_food(food_id: str, current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    db = get_db()
    if not await db.food_items.find_one({"_id": ObjectId(food_id)}):
        raise NotFoundError("Food item not found")

    await db.favorites.update_one(
        {"customer_id": current_user.id, "food_id": food_id},
        {"$setOnInsert": {"_id": ObjectId(), "created_at": datetime.now(timezone.utc), "kitchen_id": None}},
        upsert=True,
    )
    return {"favorited": True}


@router.delete("/foods/{food_id}", status_code=204)
async def unfavorite_food(food_id: str, current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    db = get_db()
    await db.favorites.delete_one({"customer_id": current_user.id, "food_id": food_id})
