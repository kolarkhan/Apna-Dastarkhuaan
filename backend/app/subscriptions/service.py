from datetime import datetime, timezone

FREE_PLAN_FOOD_LIMIT = 10
FREE_PLAN_IMAGE_LIMIT = 3
SUBSCRIPTION_DURATION_DAYS = 30
PRO_PLAN_PRICE = 999.0

PLANS = [
    {
        "id": "free",
        "name": "Free",
        "price": 0.0,
        "billing_cycle": "monthly",
        "features": [
            f"Up to {FREE_PLAN_FOOD_LIMIT} active food listings",
            f"Up to {FREE_PLAN_IMAGE_LIMIT} kitchen photos",
            "Standard search placement",
        ],
    },
    {
        "id": "pro",
        "name": "Pro Kitchen",
        "price": PRO_PLAN_PRICE,
        "billing_cycle": "monthly",
        "features": [
            "Unlimited food listings",
            "Up to 10 kitchen photos",
            "Priority placement in search results",
            "Pro badge on your kitchen profile",
        ],
    },
]


def is_pro(kitchen: dict) -> bool:
    """Pure check — no DB access — so it's safe to call from any request handler."""
    if kitchen.get("subscription_plan") != "pro":
        return False
    expires_at = kitchen.get("subscription_expires_at")
    if expires_at is None:
        return True
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > datetime.now(timezone.utc)
