from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

settings = get_settings()

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        _db = get_client()[settings.mongodb_db_name]
    return _db


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def ensure_indexes() -> None:
    db = get_db()

    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone")
    await db.users.create_index("role")

    await db.kitchens.create_index("owner_id")
    await db.kitchens.create_index([("location", "2dsphere")])
    await db.kitchens.create_index("verified")
    await db.kitchens.create_index("is_open")
    await db.kitchens.create_index("subscription_plan")

    await db.food_items.create_index("kitchen_id")
    await db.food_items.create_index("category_id")
    await db.food_items.create_index("available")
    await db.food_items.create_index([("name", "text"), ("description", "text")])

    await db.categories.create_index("slug", unique=True)

    await db.orders.create_index("customer_id")
    await db.orders.create_index("kitchen_id")
    await db.orders.create_index("order_status")
    await db.orders.create_index("created_at")

    await db.reviews.create_index("kitchen_id")
    await db.reviews.create_index("food_id")
    await db.reviews.create_index("customer_id")

    await db.favorites.create_index([("customer_id", 1), ("kitchen_id", 1)])
    await db.favorites.create_index([("customer_id", 1), ("food_id", 1)])

    await db.addresses.create_index("customer_id")

    await db.notifications.create_index("user_id")
    await db.notifications.create_index("created_at")

    await db.payments.create_index("order_id")

    await db.kitchen_earnings.create_index("kitchen_id")

    await db.messages.create_index([("order_id", 1), ("created_at", 1)])
