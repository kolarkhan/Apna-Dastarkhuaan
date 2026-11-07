"""Seeds realistic demo data: categories, kitchens, food, and demo accounts.

Run with:  python -m app.seed
Safe to re-run — it wipes and recreates the collections it manages.
"""

import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from bson import ObjectId

from app.core.security import hash_password
from app.database import close_db, ensure_indexes, get_db

# Centered on Lahore, Pakistan with small offsets per kitchen.
BASE_LAT, BASE_LNG = 31.5204, 74.3587

CATEGORIES = [
    ("Biryani", "🍚"),
    ("Karahi", "🍲"),
    ("BBQ", "🍢"),
    ("Nihari", "🥘"),
    ("Pulao", "🍛"),
    ("Daal", "🥣"),
    ("Sabzi", "🥬"),
    ("Paratha", "🫓"),
    ("Snacks", "🍟"),
    ("Desserts", "🍮"),
    ("Pakistani", "🇵🇰"),
    ("Punjabi", "🌾"),
    ("Balochi", "🏔️"),
    ("Pashtun", "⛰️"),
    ("Afghan", "🥟"),
]

KITCHENS = [
    {
        "name": "Ammi's Kitchen",
        "description": "Traditional home-cooked Punjabi food made the way Ammi makes it — slow-cooked, generously spiced, always fresh.",
        "address": "Block C, Gulberg III, Lahore",
        "offset": (0.010, 0.006),
        "cuisine_tags": ["Punjabi", "Pakistani"],
        "owner_email": "owner@demo.com",
        "verified": True,
    },
    {
        "name": "Ghar Ka Zaika",
        "description": "Ghar jaisa khana — daily home-style meals cooked fresh every morning by a family of five sisters.",
        "address": "Model Town, Lahore",
        "offset": (-0.015, 0.012),
        "cuisine_tags": ["Pakistani", "Daal"],
        "owner_email": "owner2@demo.com",
        "verified": True,
    },
    {
        "name": "Desi Dastarkhwan",
        "description": "A dastarkhwan full of classics: nihari, karahi, and paratha done right, every single day.",
        "address": "DHA Phase 5, Lahore",
        "offset": (0.020, -0.010),
        "cuisine_tags": ["Pakistani", "Nihari"],
        "owner_email": "owner3@demo.com",
        "verified": False,
    },
    {
        "name": "Balochi Home Kitchen",
        "description": "Authentic Balochi sajji and BBQ, smoked low and slow, straight from a Balochi household kitchen.",
        "address": "Johar Town, Lahore",
        "offset": (-0.008, -0.018),
        "cuisine_tags": ["Balochi", "BBQ"],
        "owner_email": "owner4@demo.com",
        "verified": True,
    },
    {
        "name": "Punjabi Taste House",
        "description": "Bold, buttery, and generous Punjabi cooking — sarson da saag to butter chicken karahi.",
        "address": "Faisal Town, Lahore",
        "offset": (0.005, 0.020),
        "cuisine_tags": ["Punjabi", "Karahi"],
        "owner_email": "owner5@demo.com",
        "verified": True,
    },
]

FOODS = [
    ("Chicken Biryani", "Biryani", 650, "Fragrant basmati rice layered with tender spiced chicken.", ["Basmati rice", "Chicken", "Yogurt", "Fried onions", "Whole spices"], "spicy", 45),
    ("Beef Karahi", "Karahi", 1200, "Classic tomato-based beef karahi cooked in a wok with ginger and green chili.", ["Beef", "Tomato", "Ginger", "Green chili", "Ghee"], "spicy", 50),
    ("Chicken Karahi", "Karahi", 950, "Restaurant-style chicken karahi with a rich tomato-ginger gravy.", ["Chicken", "Tomato", "Ginger garlic paste", "Green chili"], "medium", 40),
    ("Daal Chawal", "Daal", 350, "Comforting yellow lentils tempered with cumin, served with steamed rice.", ["Yellow lentils", "Rice", "Cumin", "Garlic"], "mild", 30),
    ("Mutton Pulao", "Pulao", 850, "Slow-cooked mutton pulao with whole spices and caramelized onions.", ["Mutton", "Basmati rice", "Whole spices", "Onion"], "medium", 60),
    ("Nihari", "Nihari", 750, "Overnight slow-cooked beef stew, rich with marrow and warm spices.", ["Beef shank", "Wheat flour", "Nihari masala"], "spicy", 90),
    ("Seekh Kabab", "BBQ", 500, "Charcoal-grilled minced beef skewers with fresh herbs and spices.", ["Beef mince", "Herbs", "Spices"], "medium", 25),
    ("Aloo Paratha", "Paratha", 200, "Whole wheat flatbread stuffed with spiced mashed potato, served with yogurt.", ["Wheat flour", "Potato", "Spices", "Ghee"], "mild", 20),
    ("Kheer", "Desserts", 250, "Creamy rice pudding slow-cooked with milk, cardamom, and pistachios.", ["Rice", "Milk", "Cardamom", "Pistachios"], "mild", 40),
    ("Gulab Jamun", "Desserts", 300, "Soft milk-solid dumplings soaked in rose-cardamom sugar syrup.", ["Milk solids", "Sugar syrup", "Rose water", "Cardamom"], "mild", 30),
]

BUSINESS_HOURS = [
    {"day": day, "open_time": "11:00", "close_time": "23:00", "closed": False}
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
]

DEMO_PASSWORD = "password123"


async def seed() -> None:
    db = get_db()
    await ensure_indexes()

    print("Clearing existing demo-managed collections...")
    for name in [
        "users",
        "kitchens",
        "food_items",
        "categories",
        "orders",
        "reviews",
        "favorites",
        "addresses",
        "notifications",
        "payments",
        "kitchen_earnings",
        "messages",
    ]:
        await db[name].delete_many({})

    now = datetime.now(timezone.utc)

    # --- Categories ---
    print("Seeding categories...")
    category_docs = []
    for name, icon in CATEGORIES:
        doc = {
            "_id": ObjectId(),
            "name": name,
            "slug": name.lower().replace(" ", "-"),
            "icon": icon,
            "image": None,
            "created_at": now,
            "updated_at": now,
        }
        category_docs.append(doc)
    await db.categories.insert_many(category_docs)
    category_by_name = {c["name"]: c for c in category_docs}

    # --- Users ---
    print("Seeding demo users...")
    customer_doc = {
        "_id": ObjectId(),
        "name": "Ayesha Khan",
        "email": "customer@demo.com",
        "phone": "+923001234567",
        "password_hash": hash_password(DEMO_PASSWORD),
        "role": "customer",
        "avatar": None,
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    admin_doc = {
        "_id": ObjectId(),
        "name": "Platform Admin",
        "email": "admin@demo.com",
        "phone": "+923009876543",
        "password_hash": hash_password(DEMO_PASSWORD),
        "role": "admin",
        "avatar": None,
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_many([customer_doc, admin_doc])

    owner_docs = {}
    for i, kitchen in enumerate(KITCHENS, start=1):
        owner = {
            "_id": ObjectId(),
            "name": f"{kitchen['name']} Owner",
            "email": kitchen["owner_email"],
            "phone": f"+92300111{i:04d}",
            "password_hash": hash_password(DEMO_PASSWORD),
            "role": "kitchen_owner",
            "avatar": None,
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        owner_docs[kitchen["owner_email"]] = owner
    await db.users.insert_many(list(owner_docs.values()))

    # --- Address for demo customer ---
    address_doc = {
        "_id": ObjectId(),
        "customer_id": str(customer_doc["_id"]),
        "label": "Home",
        "full_address": "House 12, Street 4, Gulberg II, Lahore",
        "area": "Gulberg",
        "city": "Lahore",
        "location": {"lat": BASE_LAT + 0.002, "lng": BASE_LNG + 0.001},
        "is_default": True,
        "instructions": "Leave with security guard if not home",
        "created_at": now,
        "updated_at": now,
    }
    await db.addresses.insert_one(address_doc)

    # --- Kitchens + Foods ---
    print("Seeding kitchens and food items...")
    kitchen_docs = []
    all_food_docs = []

    for idx, kitchen in enumerate(KITCHENS):
        owner = owner_docs[kitchen["owner_email"]]
        lat_off, lng_off = kitchen["offset"]
        kdoc = {
            "_id": ObjectId(),
            "owner_id": str(owner["_id"]),
            "name": kitchen["name"],
            "description": kitchen["description"],
            "address": kitchen["address"],
            "location": {"type": "Point", "coordinates": [BASE_LNG + lng_off, BASE_LAT + lat_off]},
            "cuisine_tags": kitchen["cuisine_tags"],
            "business_hours": BUSINESS_HOURS,
            "images": [f"https://picsum.photos/seed/kitchen{idx}/800/500"],
            "rating": round(random.uniform(4.0, 5.0), 1),
            "review_count": random.randint(15, 120),
            "verified": kitchen["verified"],
            "is_open": True,
            "status": "approved",
            "subscription_plan": "pro" if idx == 1 else "free",
            "subscription_expires_at": (now + timedelta(days=20)) if idx == 1 else None,
            "created_at": now,
            "updated_at": now,
        }
        kitchen_docs.append(kdoc)

    await db.kitchens.insert_many(kitchen_docs)

    # Distribute the 10 dishes across the 5 kitchens (2 each), tagged to their category.
    for i, (name, cat_name, price, desc, ingredients, spice, prep_time) in enumerate(FOODS):
        kitchen_doc = kitchen_docs[i % len(kitchen_docs)]
        category = category_by_name[cat_name]
        fdoc = {
            "_id": ObjectId(),
            "kitchen_id": str(kitchen_doc["_id"]),
            "name": name,
            "description": desc,
            "price": float(price),
            "images": [f"https://picsum.photos/seed/food{i}/600/450"],
            "category_id": str(category["_id"]),
            "ingredients": ingredients,
            "portion": "1 person",
            "preparation_time_minutes": prep_time,
            "spice_level": spice,
            "customization_options": [
                {"name": "Extra spicy", "price_delta": 0},
                {"name": "Less spicy", "price_delta": 0},
                {"name": "No onion", "price_delta": 0},
                {"name": "Extra portion", "price_delta": round(price * 0.4, 2)},
            ],
            "available": True,
            "rating": round(random.uniform(4.0, 5.0), 1),
            "review_count": random.randint(5, 80),
            "created_at": now,
            "updated_at": now,
        }
        all_food_docs.append(fdoc)

    await db.food_items.insert_many(all_food_docs)

    # --- One completed demo order so reorder/review flows have something to work with ---
    print("Seeding a delivered demo order...")
    demo_kitchen = kitchen_docs[0]
    demo_foods = [f for f in all_food_docs if f["kitchen_id"] == str(demo_kitchen["_id"])][:2]
    order_items = [
        {
            "item_id": uuid.uuid4().hex,
            "food_id": str(f["_id"]),
            "name": f["name"],
            "image": f["images"][0],
            "price": f["price"],
            "quantity": 1,
            "customizations": [],
            "special_instructions": None,
        }
        for f in demo_foods
    ]
    subtotal = sum(i["price"] * i["quantity"] for i in order_items)
    service_fee = round(subtotal * 0.03, 2)
    delivery_fee = 99.0
    total = round(subtotal + service_fee + delivery_fee, 2)
    placed_at = now - timedelta(days=2)

    demo_order = {
        "_id": ObjectId(),
        "order_number": "AD10000001",
        "customer_id": str(customer_doc["_id"]),
        "kitchen_id": str(demo_kitchen["_id"]),
        "kitchen_name": demo_kitchen["name"],
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "service_fee": service_fee,
        "discount": 0.0,
        "total": total,
        "address": {
            "label": address_doc["label"],
            "full_address": address_doc["full_address"],
            "area": address_doc["area"],
            "city": address_doc["city"],
            "location": address_doc["location"],
            "instructions": address_doc["instructions"],
        },
        "payment_method": "cod",
        "payment_status": "pending",
        "order_status": "delivered",
        "status_history": [
            {"status": "pending", "at": placed_at},
            {"status": "accepted", "at": placed_at + timedelta(minutes=5)},
            {"status": "delivered", "at": placed_at + timedelta(minutes=70)},
        ],
        "notes": None,
        "scheduled_for": None,
        "cancellation_reason": None,
        "created_at": placed_at,
        "updated_at": placed_at + timedelta(minutes=70),
    }
    await db.orders.insert_one(demo_order)
    await db.kitchen_earnings.insert_one(
        {
            "_id": ObjectId(),
            "kitchen_id": str(demo_kitchen["_id"]),
            "order_id": str(demo_order["_id"]),
            "order_number": demo_order["order_number"],
            "amount": demo_order["subtotal"],
            "created_at": demo_order["updated_at"],
        }
    )

    print("\nSeed complete!")
    print("Demo accounts (password: {}):".format(DEMO_PASSWORD))
    print(f"  Customer:      {customer_doc['email']}")
    print(f"  Kitchen owner: {KITCHENS[0]['owner_email']}  (owns '{KITCHENS[0]['name']}')")
    print(f"  Admin:         {admin_doc['email']}")


async def main() -> None:
    try:
        await seed()
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
