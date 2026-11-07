from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.deps import CurrentUser, require_role
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationAppError
from app.core.pagination import PageParams, build_paged_response, page_params
from app.core.storage import get_storage_provider, validate_image_upload
from app.database import get_db
from app.kitchens.schemas import CreateKitchenRequest, UpdateBusinessHoursRequest, UpdateKitchenRequest
from app.subscriptions.service import FREE_PLAN_IMAGE_LIMIT, is_pro

router = APIRouter(prefix="/kitchens", tags=["kitchens"])


def serialize_kitchen(doc: dict, distance_km: float | None = None) -> dict:
    coords = doc.get("location", {}).get("coordinates", [None, None])
    out = {
        "id": str(doc["_id"]),
        "owner_id": doc["owner_id"],
        "name": doc["name"],
        "description": doc.get("description", ""),
        "images": doc.get("images", []),
        "location": {"lng": coords[0], "lat": coords[1]} if coords[0] is not None else None,
        "address": doc.get("address", ""),
        "cuisine_tags": doc.get("cuisine_tags", []),
        "business_hours": doc.get("business_hours", []),
        "rating": round(doc.get("rating", 0.0), 1),
        "review_count": doc.get("review_count", 0),
        "verified": doc.get("verified", False),
        "is_open": doc.get("is_open", True),
        "status": doc.get("status", "pending"),  # pending | approved | rejected | suspended
        "subscription_plan": "pro" if is_pro(doc) else "free",
        "payment_details": {
            "method": doc.get("payment_details", {}).get("method"),
            "account_title": doc.get("payment_details", {}).get("account_title"),
            "account_number": doc.get("payment_details", {}).get("account_number"),
            "bank_name": doc.get("payment_details", {}).get("bank_name"),
        },
        "auto_accept_orders": doc.get("auto_accept_orders", False),
    }
    if distance_km is not None:
        out["distance_km"] = round(distance_km, 2)
    return out


@router.get("")
async def list_kitchens(
    params: Annotated[PageParams, Depends(page_params)],
    lat: float | None = None,
    lng: float | None = None,
    search: str | None = None,
    verified: bool | None = None,
    open_now: bool | None = None,
    min_rating: float | None = None,
    cuisine: str | None = None,
    sort: str = Query("distance", pattern="^(distance|rating|newest)$"),
):
    db = get_db()

    match: dict = {"status": "approved"}
    if verified is not None:
        match["verified"] = verified
    if open_now:
        match["is_open"] = True
    if min_rating is not None:
        match["rating"] = {"$gte": min_rating}
    if cuisine:
        match["cuisine_tags"] = cuisine
    if search:
        match["name"] = {"$regex": search, "$options": "i"}

    # Pro kitchens are boosted to the top of every sort mode — computed from plan +
    # expiry rather than trusted as stored, so an expired Pro doesn't keep its boost.
    pro_boost = {
        "$cond": [
            {
                "$and": [
                    {"$eq": ["$subscription_plan", "pro"]},
                    {
                        "$or": [
                            {"$eq": [{"$ifNull": ["$subscription_expires_at", None]}, None]},
                            {"$gt": ["$subscription_expires_at", "$$NOW"]},
                        ]
                    },
                ]
            },
            1,
            0,
        ]
    }

    if lat is not None and lng is not None:
        pipeline = [
            {
                "$geoNear": {
                    "near": {"type": "Point", "coordinates": [lng, lat]},
                    "distanceField": "distance_m",
                    "spherical": True,
                    "query": match,
                }
            },
            {"$addFields": {"_pro_boost": pro_boost}},
        ]
        sort_stage = {"_pro_boost": -1, "rating": -1} if sort == "rating" else {"_pro_boost": -1, "distance_m": 1}
        pipeline.append({"$sort": sort_stage})

        count_pipeline = pipeline + [{"$count": "total"}]
        total_result = await db.kitchens.aggregate(count_pipeline).to_list(1)
        total = total_result[0]["total"] if total_result else 0

        pipeline += [{"$skip": params.skip}, {"$limit": params.page_size}]
        docs = await db.kitchens.aggregate(pipeline).to_list(params.page_size)
        items = [serialize_kitchen(d, distance_km=d["distance_m"] / 1000) for d in docs]
    else:
        total = await db.kitchens.count_documents(match)
        sort_field = "rating" if sort == "rating" else "created_at"
        pipeline = [
            {"$match": match},
            {"$addFields": {"_pro_boost": pro_boost}},
            {"$sort": {"_pro_boost": -1, sort_field: -1}},
            {"$skip": params.skip},
            {"$limit": params.page_size},
        ]
        docs = await db.kitchens.aggregate(pipeline).to_list(params.page_size)
        items = [serialize_kitchen(d) for d in docs]

    return build_paged_response(items, total, params)


@router.get("/mine")
async def get_my_kitchen(current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))]):
    db = get_db()
    doc = await db.kitchens.find_one({"owner_id": current_user.id})
    if not doc:
        raise NotFoundError("You haven't created a kitchen yet")
    return serialize_kitchen(doc)


@router.get("/{kitchen_id}")
async def get_kitchen(kitchen_id: str):
    db = get_db()
    doc = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    if not doc:
        raise NotFoundError("Kitchen not found")
    return serialize_kitchen(doc)


@router.post("", status_code=201)
async def create_kitchen(
    payload: CreateKitchenRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    db = get_db()

    if await db.kitchens.find_one({"owner_id": current_user.id}):
        raise ConflictError("You already have a kitchen. Each owner can manage one kitchen.")

    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "owner_id": current_user.id,
        "name": payload.name,
        "description": payload.description,
        "address": payload.address,
        "location": {"type": "Point", "coordinates": [payload.location.lng, payload.location.lat]},
        "cuisine_tags": payload.cuisine_tags,
        "business_hours": [bh.model_dump() for bh in payload.business_hours],
        "images": [],
        "rating": 0.0,
        "review_count": 0,
        "verified": False,
        "is_open": True,
        "status": "pending",  # awaits admin approval
        "subscription_plan": "free",
        "subscription_expires_at": None,
        "payment_details": {},
        "auto_accept_orders": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.kitchens.insert_one(doc)
    return serialize_kitchen(doc)


async def _get_owned_kitchen(kitchen_id: str, current_user: CurrentUser) -> dict:
    db = get_db()
    doc = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    if not doc:
        raise NotFoundError("Kitchen not found")
    if doc["owner_id"] != current_user.id:
        raise ForbiddenError("You do not own this kitchen")
    return doc


@router.patch("/{kitchen_id}")
async def update_kitchen(
    kitchen_id: str,
    payload: UpdateKitchenRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    await _get_owned_kitchen(kitchen_id, current_user)
    db = get_db()

    updates = payload.model_dump(exclude_unset=True, exclude_none=True, exclude={"payment_details"})
    if "location" in updates:
        loc = updates.pop("location")
        updates["location"] = {"type": "Point", "coordinates": [loc["lng"], loc["lat"]]}
    if payload.payment_details is not None:
        updates["payment_details"] = payload.payment_details.model_dump()
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.kitchens.update_one({"_id": ObjectId(kitchen_id)}, {"$set": updates})

    doc = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    return serialize_kitchen(doc)


@router.patch("/{kitchen_id}/business-hours")
async def update_business_hours(
    kitchen_id: str,
    payload: UpdateBusinessHoursRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    await _get_owned_kitchen(kitchen_id, current_user)
    db = get_db()
    await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)},
        {
            "$set": {
                "business_hours": [bh.model_dump() for bh in payload.business_hours],
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    doc = await db.kitchens.find_one({"_id": ObjectId(kitchen_id)})
    return serialize_kitchen(doc)


@router.patch("/{kitchen_id}/toggle-open")
async def toggle_open(
    kitchen_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    doc = await _get_owned_kitchen(kitchen_id, current_user)
    db = get_db()
    new_state = not doc.get("is_open", True)
    await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)},
        {"$set": {"is_open": new_state, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"is_open": new_state}


@router.post("/{kitchen_id}/images")
async def upload_kitchen_image(
    kitchen_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
    file: UploadFile = File(...),
):
    kitchen = await _get_owned_kitchen(kitchen_id, current_user)
    if not is_pro(kitchen) and len(kitchen.get("images", [])) >= FREE_PLAN_IMAGE_LIMIT:
        raise ValidationAppError(
            f"Free plan kitchens can have up to {FREE_PLAN_IMAGE_LIMIT} photos. Upgrade to Pro Kitchen for more."
        )
    validate_image_upload(file)
    url = await get_storage_provider().upload(file, folder="kitchens")

    db = get_db()
    await db.kitchens.update_one(
        {"_id": ObjectId(kitchen_id)},
        {"$push": {"images": url}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return {"image": url}
