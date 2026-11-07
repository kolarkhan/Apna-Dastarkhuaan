from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.deps import CurrentUser, require_role
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationAppError
from app.core.pagination import PageParams, build_paged_response, page_params
from app.core.storage import get_storage_provider, validate_image_upload
from app.database import get_db
from app.foods.schemas import CreateFoodRequest, UpdateFoodRequest
from app.subscriptions.service import FREE_PLAN_FOOD_LIMIT, is_pro

router = APIRouter(prefix="/foods", tags=["foods"])


def serialize_food(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "kitchen_id": doc["kitchen_id"],
        "name": doc["name"],
        "description": doc.get("description", ""),
        "price": doc["price"],
        "images": doc.get("images", []),
        "category_id": doc.get("category_id"),
        "ingredients": doc.get("ingredients", []),
        "portion": doc.get("portion", "1 person"),
        "preparation_time_minutes": doc.get("preparation_time_minutes", 30),
        "spice_level": doc.get("spice_level", "medium"),
        "customization_options": doc.get("customization_options", []),
        "available": doc.get("available", True),
        "rating": round(doc.get("rating", 0.0), 1),
        "review_count": doc.get("review_count", 0),
    }


@router.get("")
async def list_foods(
    params: Annotated[PageParams, Depends(page_params)],
    kitchen_id: str | None = None,
    category_id: str | None = None,
    search: str | None = None,
    available: bool | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    spice_level: str | None = None,
    sort: str = Query("popular", pattern="^(popular|price_asc|price_desc|rating)$"),
):
    db = get_db()
    match: dict = {}
    if kitchen_id:
        match["kitchen_id"] = kitchen_id
    if category_id:
        match["category_id"] = category_id
    if available is not None:
        match["available"] = available
    if spice_level:
        match["spice_level"] = spice_level
    if min_price is not None or max_price is not None:
        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        match["price"] = price_filter
    if search:
        match["$text"] = {"$search": search}

    sort_map = {
        "popular": [("review_count", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "rating": [("rating", -1)],
    }

    total = await db.food_items.count_documents(match)
    cursor = (
        db.food_items.find(match)
        .sort(sort_map[sort])
        .skip(params.skip)
        .limit(params.page_size)
    )
    items = [serialize_food(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.get("/{food_id}")
async def get_food(food_id: str):
    db = get_db()
    doc = await db.food_items.find_one({"_id": ObjectId(food_id)})
    if not doc:
        raise NotFoundError("Food item not found")
    return serialize_food(doc)


async def _get_owned_kitchen(current_user: CurrentUser) -> dict:
    db = get_db()
    kitchen = await db.kitchens.find_one({"owner_id": current_user.id})
    if not kitchen:
        raise NotFoundError("Create your kitchen before adding food")
    return kitchen


@router.post("", status_code=201)
async def create_food(
    payload: CreateFoodRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    kitchen = await _get_owned_kitchen(current_user)
    kitchen_id = str(kitchen["_id"])
    db = get_db()

    if not is_pro(kitchen):
        active_count = await db.food_items.count_documents({"kitchen_id": kitchen_id})
        if active_count >= FREE_PLAN_FOOD_LIMIT:
            raise ValidationAppError(
                f"Free plan kitchens can list up to {FREE_PLAN_FOOD_LIMIT} food items. Upgrade to Pro Kitchen for unlimited listings."
            )

    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "kitchen_id": kitchen_id,
        **payload.model_dump(exclude={"customization_options"}),
        "customization_options": [c.model_dump() for c in payload.customization_options],
        "images": [],
        "rating": 0.0,
        "review_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    await db.food_items.insert_one(doc)
    return serialize_food(doc)


async def _get_owned_food(food_id: str, current_user: CurrentUser) -> dict:
    db = get_db()
    food = await db.food_items.find_one({"_id": ObjectId(food_id)})
    if not food:
        raise NotFoundError("Food item not found")
    kitchen = await db.kitchens.find_one({"_id": ObjectId(food["kitchen_id"])})
    if not kitchen or kitchen["owner_id"] != current_user.id:
        raise ForbiddenError("You do not own this food item")
    return food


@router.put("/{food_id}")
async def update_food(
    food_id: str,
    payload: UpdateFoodRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    await _get_owned_food(food_id, current_user)
    db = get_db()

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "customization_options" in updates:
        updates["customization_options"] = [c for c in updates["customization_options"]]
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.food_items.update_one({"_id": ObjectId(food_id)}, {"$set": updates})

    doc = await db.food_items.find_one({"_id": ObjectId(food_id)})
    return serialize_food(doc)


@router.patch("/{food_id}/availability")
async def set_availability(
    food_id: str,
    available: bool,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    await _get_owned_food(food_id, current_user)
    db = get_db()
    await db.food_items.update_one(
        {"_id": ObjectId(food_id)},
        {"$set": {"available": available, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"available": available}


@router.delete("/{food_id}", status_code=204)
async def delete_food(
    food_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    await _get_owned_food(food_id, current_user)
    db = get_db()
    await db.food_items.delete_one({"_id": ObjectId(food_id)})


@router.post("/{food_id}/images")
async def upload_food_image(
    food_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
    file: UploadFile = File(...),
):
    await _get_owned_food(food_id, current_user)
    validate_image_upload(file)
    url = await get_storage_provider().upload(file, folder="foods")

    db = get_db()
    await db.food_items.update_one(
        {"_id": ObjectId(food_id)},
        {"$push": {"images": url}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return {"image": url}
