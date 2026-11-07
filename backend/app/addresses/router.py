from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.addresses.schemas import CreateAddressRequest, UpdateAddressRequest
from app.core.deps import CurrentUser, get_current_user
from app.core.exceptions import NotFoundError
from app.database import get_db

router = APIRouter(prefix="/addresses", tags=["addresses"])


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "label": doc.get("label", "Home"),
        "full_address": doc["full_address"],
        "area": doc.get("area"),
        "city": doc.get("city"),
        "location": doc.get("location"),
        "is_default": doc.get("is_default", False),
        "instructions": doc.get("instructions"),
    }


@router.get("")
async def list_addresses(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    db = get_db()
    cursor = db.addresses.find({"customer_id": current_user.id}).sort("is_default", -1)
    return [_serialize(doc) async for doc in cursor]


@router.post("", status_code=201)
async def create_address(
    payload: CreateAddressRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    db = get_db()
    now = datetime.now(timezone.utc)

    existing_count = await db.addresses.count_documents({"customer_id": current_user.id})
    is_default = payload.is_default or existing_count == 0

    if is_default:
        await db.addresses.update_many({"customer_id": current_user.id}, {"$set": {"is_default": False}})

    doc = {
        "_id": ObjectId(),
        "customer_id": current_user.id,
        **payload.model_dump(exclude={"is_default"}),
        "is_default": is_default,
        "created_at": now,
        "updated_at": now,
    }
    await db.addresses.insert_one(doc)
    return _serialize(doc)


@router.patch("/{address_id}")
async def update_address(
    address_id: str,
    payload: UpdateAddressRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    db = get_db()
    existing = await db.addresses.find_one({"_id": ObjectId(address_id), "customer_id": current_user.id})
    if not existing:
        raise NotFoundError("Address not found")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if updates.get("is_default"):
        await db.addresses.update_many({"customer_id": current_user.id}, {"$set": {"is_default": False}})

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.addresses.update_one({"_id": ObjectId(address_id)}, {"$set": updates})

    doc = await db.addresses.find_one({"_id": ObjectId(address_id)})
    return _serialize(doc)


@router.delete("/{address_id}", status_code=204)
async def delete_address(
    address_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    db = get_db()
    result = await db.addresses.delete_one({"_id": ObjectId(address_id), "customer_id": current_user.id})
    if result.deleted_count == 0:
        raise NotFoundError("Address not found")
