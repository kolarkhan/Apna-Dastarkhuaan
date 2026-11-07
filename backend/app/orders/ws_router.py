from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.security import decode_token
from app.core.ws_manager import order_ws_manager
from app.database import get_db

router = APIRouter()


@router.websocket("/ws/orders/{order_id}")
async def order_tracking_socket(websocket: WebSocket, order_id: str, token: str):
    """Real-time order status stream. Client connects with ?token=<access_token>.

    Only the customer who placed the order or the owner of the kitchen fulfilling it
    may subscribe — the same rule as GET /orders/{id}.
    """
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        await websocket.close(code=4401)
        return

    try:
        order_object_id = ObjectId(order_id)
    except InvalidId:
        await websocket.close(code=4404)
        return

    db = get_db()
    order = await db.orders.find_one({"_id": order_object_id})
    if not order:
        await websocket.close(code=4404)
        return

    user_id, role = payload.get("sub"), payload.get("role")
    authorized = role == "admin" or (role == "customer" and order["customer_id"] == user_id)
    if not authorized and role == "kitchen_owner":
        kitchen = await db.kitchens.find_one({"_id": ObjectId(order["kitchen_id"])})
        authorized = bool(kitchen and kitchen["owner_id"] == user_id)

    if not authorized:
        await websocket.close(code=4403)
        return

    await order_ws_manager.connect(order_id, websocket)
    try:
        await websocket.send_json({"type": "connected", "order_id": order_id, "status": order["order_status"]})
        while True:
            # Client doesn't need to send anything; keep the connection open until it disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        order_ws_manager.disconnect(order_id, websocket)
