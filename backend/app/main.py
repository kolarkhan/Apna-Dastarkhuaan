from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.addresses.router import router as addresses_router
from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.categories.router import router as categories_router
from app.chat.router import router as chat_router
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.database import ensure_indexes, close_db
from app.favorites.router import router as favorites_router
from app.foods.router import router as foods_router
from app.kitchen_earnings.router import router as earnings_router
from app.kitchens.router import router as kitchens_router
from app.notifications.router import router as notifications_router
from app.orders.router import router as orders_router
from app.orders.ws_router import router as orders_ws_router
from app.payments.router import router as payments_router
from app.reviews.router import router as reviews_router
from app.subscriptions.router import router as subscriptions_router
from app.users.router import router as users_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.local_storage_dir).mkdir(parents=True, exist_ok=True)
    await ensure_indexes()
    yield
    await close_db()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

Path(settings.local_storage_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.local_storage_dir), name="uploads")

api = settings.api_prefix
app.include_router(auth_router, prefix=api)
app.include_router(users_router, prefix=api)
app.include_router(addresses_router, prefix=api)
app.include_router(kitchens_router, prefix=api)
app.include_router(foods_router, prefix=api)
app.include_router(categories_router, prefix=api)
app.include_router(orders_router, prefix=api)
app.include_router(chat_router, prefix=api)
app.include_router(orders_ws_router)  # websocket path is not versioned under /api
app.include_router(reviews_router, prefix=api)
app.include_router(favorites_router, prefix=api)
app.include_router(payments_router, prefix=api)
app.include_router(notifications_router, prefix=api)
app.include_router(earnings_router, prefix=api)
app.include_router(subscriptions_router, prefix=api)
app.include_router(admin_router, prefix=api)


@app.get("/")
async def root():
    return {"app": settings.app_name, "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
