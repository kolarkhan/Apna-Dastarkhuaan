from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, get_current_user, require_role
from app.core.pagination import PageParams, build_paged_response, page_params
from app.database import get_db
from app.orders import service
from app.orders.schemas import CancelOrderRequest, CreateOrderRequest, UpdateOrderStatusRequest

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", status_code=201)
async def create_order(
    payload: CreateOrderRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("customer"))],
):
    return await service.create_order(current_user.id, payload)


@router.get("")
async def list_orders(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    params: Annotated[PageParams, Depends(page_params)],
    status_filter: str | None = None,
):
    db = get_db()
    match: dict = {}

    if current_user.role == "customer":
        match["customer_id"] = current_user.id
    elif current_user.role == "kitchen_owner":
        kitchen = await db.kitchens.find_one({"owner_id": current_user.id})
        match["kitchen_id"] = str(kitchen["_id"]) if kitchen else "__none__"
    # admin sees all orders

    if status_filter:
        match["order_status"] = status_filter

    total = await db.orders.count_documents(match)
    cursor = db.orders.find(match).sort("created_at", -1).skip(params.skip).limit(params.page_size)
    items = [service.serialize_order(d) async for d in cursor]
    return build_paged_response(items, total, params)


@router.get("/active")
async def get_active_order(current_user: Annotated[CurrentUser, Depends(require_role("customer"))]):
    """Used by the Home screen's compact active-order tracking card."""
    db = get_db()
    active_statuses = ["pending", "accepted"]
    doc = await db.orders.find_one(
        {"customer_id": current_user.id, "order_status": {"$in": active_statuses}}, sort=[("created_at", -1)]
    )
    return service.serialize_order(doc) if doc else None


@router.get("/{order_id}")
async def get_order(order_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    order = await service.get_order_or_404(order_id)
    await service.assert_can_view(order, current_user.id, current_user.role)

    db = get_db()
    customer = await db.users.find_one({"_id": ObjectId(order["customer_id"])})
    kitchen = await db.kitchens.find_one({"_id": ObjectId(order["kitchen_id"])})
    owner = await db.users.find_one({"_id": ObjectId(kitchen["owner_id"])}) if kitchen else None

    return {
        **service.serialize_order(order),
        "customer_name": customer["name"] if customer else "Customer",
        "customer_phone": customer.get("phone") if customer else None,
        "customer_avatar": customer.get("avatar") if customer else None,
        "kitchen_phone": owner.get("phone") if owner else None,
    }


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: UpdateOrderStatusRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("kitchen_owner"))],
):
    return await service.advance_status(order_id, payload.status, current_user.id, payload.reason)


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    payload: CancelOrderRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("customer"))],
):
    return await service.cancel_order(order_id, current_user.id, payload.reason)
