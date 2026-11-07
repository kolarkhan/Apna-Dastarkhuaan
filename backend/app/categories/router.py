import re
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.categories.schemas import CreateCategoryRequest, UpdateCategoryRequest
from app.core.deps import require_role
from app.core.exceptions import ConflictError, NotFoundError
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "slug": doc["slug"],
        "icon": doc.get("icon"),
        "image": doc.get("image"),
    }


@router.get("")
async def list_categories():
    db = get_db()
    cursor = db.categories.find().sort("name", 1)
    return [_serialize(doc) async for doc in cursor]


@router.post("", status_code=201, dependencies=[Depends(require_role("admin"))])
async def create_category(payload: CreateCategoryRequest):
    db = get_db()
    slug = _slugify(payload.name)

    if await db.categories.find_one({"slug": slug}):
        raise ConflictError("A category with this name already exists")

    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "name": payload.name,
        "slug": slug,
        "icon": payload.icon,
        "image": payload.image,
        "created_at": now,
        "updated_at": now,
    }
    await db.categories.insert_one(doc)
    return _serialize(doc)


@router.patch("/{category_id}", dependencies=[Depends(require_role("admin"))])
async def update_category(category_id: str, payload: UpdateCategoryRequest):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "name" in updates:
        updates["slug"] = _slugify(updates["name"])
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await db.categories.update_one({"_id": ObjectId(category_id)}, {"$set": updates})
        if result.matched_count == 0:
            raise NotFoundError("Category not found")

    doc = await db.categories.find_one({"_id": ObjectId(category_id)})
    if not doc:
        raise NotFoundError("Category not found")
    return _serialize(doc)


@router.delete("/{category_id}", status_code=204, dependencies=[Depends(require_role("admin"))])
async def delete_category(category_id: str):
    db = get_db()
    result = await db.categories.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        raise NotFoundError("Category not found")
