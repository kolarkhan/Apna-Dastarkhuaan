# Apna Dastarkhuaan

**Ghar jaisa khana, apne ghar ke qareeb.**

A marketplace connecting customers with home-based (desi) kitchens. Three apps in this repo:

```
mobile/    Customer & kitchen-owner app (Expo / React Native / TypeScript)
backend/   REST + WebSocket API (FastAPI / MongoDB)
admin/     Admin dashboard (Next.js / Tailwind / shadcn-ui)
```

## Prerequisites

- Node.js 20+, npm
- Python 3.11+
- Docker (for local MongoDB) — or your own MongoDB URI

## 1. Database

```bash
docker compose up -d
```

This starts MongoDB on `localhost:27017`.

## 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env
python -m app.seed            # seeds demo kitchens, foods, users
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Seeded demo accounts (see `app/seed.py`):
- Customer: `customer@demo.com` / `password123`
- Kitchen owner: `owner@demo.com` / `password123`
- Admin: `admin@demo.com` / `password123`

## 3. Mobile app

```bash
cd mobile
npm install
copy .env.example .env    # set EXPO_PUBLIC_API_URL to your machine's LAN IP, e.g. http://192.168.1.5:8000
npx expo start
```

Scan the QR code with Expo Go (Android/iOS), or press `a` / `i` for an emulator/simulator.

> Note: `localhost` will not work from a physical device or most emulators — use your computer's LAN IP in `EXPO_PUBLIC_API_URL`.

## 4. Admin panel

```bash
cd admin
npm install
copy .env.example .env.local
npm run dev
```

http://localhost:3000

## Architecture notes

- **Image storage**: abstracted behind `StorageProvider` (`backend/app/core/storage.py`). Falls back to local-disk serving in dev when no Cloudinary credentials are set — no cloud account required to develop.
- **Payments**: abstracted behind `PaymentProvider` (`backend/app/payments/providers/`). Cash on Delivery works end-to-end today; Easypaisa/JazzCash/Card providers are implemented against mock responses and ready to swap in real merchant credentials.
- **Real-time order tracking**: FastAPI WebSocket at `/ws/orders/{order_id}`, consumed by the mobile app's `useOrderTracking` hook.
- **Maps/location**: `expo-location` + haversine distance now (no API key needed); `MapProvider` abstraction leaves room for Google Maps/Mapbox later.
