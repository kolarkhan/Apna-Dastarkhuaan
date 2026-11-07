from collections import defaultdict

from fastapi import WebSocket


class OrderWebSocketManager:
    """Broadcasts order-status updates to any client watching that order (customer & kitchen owner)."""

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, order_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[order_id].add(websocket)

    def disconnect(self, order_id: str, websocket: WebSocket) -> None:
        self._connections[order_id].discard(websocket)
        if not self._connections[order_id]:
            self._connections.pop(order_id, None)

    async def broadcast(self, order_id: str, message: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._connections.get(order_id, set()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(order_id, ws)


order_ws_manager = OrderWebSocketManager()
