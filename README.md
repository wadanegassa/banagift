# BanaGifts — Gift Discovery & Delivery Platform

**BanaGifts** is a gift delivery platform built for **Ethiopia**. Customers browse gifts online (prices in **Ethiopian Birr / ETB**), request delivery to **any location**, then **call the shop** to confirm the gift, place, fee, and payment. There is **no online payment gateway**.

| | |
|---|---|
| **Storefront** | Customer website — no login required |
| **Admin** | Shop operations dashboard — secure login |
| **Currency** | Ethiopian Birr (ETB) |
| **Confirmation** | By phone (`tel:` links throughout) |
| **Repo** | https://github.com/wadanegassa/banagifts |

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [How to run (step by step)](#2-how-to-run-step-by-step)
3. [Technologies in detail](#3-technologies-in-detail)
4. [Why customers have no login](#4-why-customers-have-no-login)
5. [Roles](#5-roles)
6. [Customer platform — features & pages](#6-customer-platform--features--pages)
7. [Admin platform — features & pages](#7-admin-platform--features--pages)
8. [End-to-end flows](#8-end-to-end-flows)
9. [Business rules](#9-business-rules)
10. [Architecture](#10-architecture)
11. [Repository structure](#11-repository-structure)
12. [API reference](#12-api-reference)
13. [Database & storage](#13-database--storage)
14. [Environment variables](#14-environment-variables)
15. [Supabase setup](#15-supabase-setup)
16. [First admin account](#16-first-admin-account)
17. [Scripts, tests & builds](#17-scripts-tests--builds)
18. [PWA](#18-pwa)
19. [Design & branding](#19-design--branding)
20. [Security notes](#20-security-notes)
21. [Deployment](#21-deployment)
22. [What is intentionally out of scope](#22-what-is-intentionally-out-of-scope)

---

## 1. Product overview

BanaGifts combines:

- A **mobile-friendly gift catalog** (flowers, boxes, chocolates, occasions, etc.)
- **Guest checkout** with free-text delivery location anywhere in Ethiopia
- **Phone-first confirmation** — the shop and customer talk to finalize everything
- An **admin dashboard** to manage products, orders, payment status, suppliers, and delivery people (by phone, no separate apps for them)

**One-sentence pitch:**  
*Website captures the gift request; the phone call closes the sale; admin is the operations desk.*

---

## 2. How to run (step by step)

### Requirements

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | 18+ (22+ recommended) | Runs API and Vite apps |
| **pnpm** | 9+ | Monorepo package manager |
| **Git** | any recent | Clone the repo |
| **Supabase account** | optional for first run | Needed for real DB/auth; skip with mock mode |

Install pnpm if needed:

```bash
npm install -g pnpm
```

### Option A — Fastest demo (mock database, no Supabase)

Uses an in-memory catalog and orders. Good for UI demos.

```bash
# 1. Clone
git clone https://github.com/wadanegassa/banagifts.git
cd banagifts

# 2. Install dependencies (all workspaces)
pnpm install

# 3. Copy env examples
cp server/.env.example server/.env
cp client/.env.example client/.env
cp admin/.env.example admin/.env

# 4. Keep mock mode on the server
# In server/.env make sure:
#   USE_MOCK_DB=true

# 5. Start the three apps (three terminals)
pnpm dev:server    # API  → http://localhost:4000
pnpm dev:client    # Shop → http://localhost:5173
pnpm dev:admin     # Admin → http://localhost:5175
```

Or from each package folder:

```bash
cd server && npm run dev
cd client && npm run dev
cd admin && npm run dev
```

| App | URL | What to open |
|-----|-----|----------------|
| Customer storefront | http://localhost:5173 | Gifts, checkout, My Orders |
| Admin dashboard | http://localhost:5175 | Login → orders & products |
| API health check | http://localhost:4000/api/health | Should return `"status":"ok"` |

In mock mode, admin can use the **dev mock login** if `VITE_USE_MOCK_AUTH=true` in `admin/.env`.

### Option B — Full real stack (Supabase)

1. Create a project at [supabase.com](https://supabase.com/dashboard).  
2. Apply SQL migrations from `supabase/migrations/` (SQL Editor or `supabase db push`).  
3. Optionally run `supabase/seed.sql` on a **dev** database only.  
4. Create an Auth user and promote them to admin (see [First admin account](#16-first-admin-account)).  
5. Fill env files:

**`server/.env`**
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5175
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_MOCK_DB=false
```

**`client/.env`** and **`admin/.env`**
```env
VITE_API_BASE_URL=
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_AUTH=false
```

(`admin/.env` may also set `VITE_STOREFRONT_URL=http://localhost:5173`.)

6. Start the three apps the same way as Option A.

### How the apps talk to each other while developing

- Storefront and admin call **`/api/...`** on their own origin (5173 / 5175).  
- Vite **proxies** `/api` → `http://localhost:4000`.  
- You do **not** need to set `VITE_API_BASE_URL` for local dev.

### Verify it works

1. Open http://localhost:5173 → browse gifts → add to cart → checkout.  
2. Call CTAs should show the shop phone from settings.  
3. Open http://localhost:5175 → sign in → see the new order.  
4. Update status → check **My Orders** / **Track** on the storefront.

### Production build (local preview)

```bash
pnpm --filter @atelier/server build
pnpm --filter @atelier/client build
pnpm --filter @atelier/admin build

# API
cd server && NODE_ENV=production USE_MOCK_DB=false node dist/index.js

# Static apps (example)
cd client && pnpm preview    # preview storefront build
cd admin && pnpm preview     # preview admin build
```

---

## 3. Technologies in detail

### High-level stack

| Area | Technology | Role in BanaGifts |
|------|------------|-------------------|
| Language | **TypeScript** | Typed frontend + backend |
| Customer UI | **React 18** + **Vite 5** | Storefront SPA |
| Admin UI | **React 18** + **Vite 5** | Admin SPA (separate port) |
| Styling | **Tailwind CSS 3** | Layout, responsive UI, brand colors |
| Routing | **React Router 6** | Pages (`/gifts`, `/orders`, `/admin` routes, etc.) |
| Server state | **TanStack Query (React Query) 5** | Fetch/cache catalog, orders, settings |
| Forms | **React Hook Form** + **Zod** | Checkout & admin forms with validation |
| Icons | **Lucide React** | UI icons |
| SEO / titles | **react-helmet-async** | Page `<title>` and meta |
| API | **Node.js** + **Express 4** | REST API on port 4000 |
| Validation (API) | **Zod** | Request body/query/params |
| Auth / DB / files | **Supabase** | Postgres, Auth, Storage |
| Security headers | **Helmet** | HTTP hardening |
| CORS | **cors** | Allow storefront + admin origins |
| Rate limiting | **express-rate-limit** | Protect order/track endpoints |
| Uploads | **Multer** | Product image multipart upload |
| Logging | **Pino** / **pino-http** | Structured request logs |
| PWA | **vite-plugin-pwa** + **Workbox** | Installable storefront |
| Monorepo | **pnpm workspaces** | `client`, `admin`, `server` packages |
| Tests | **Vitest** (+ Testing Library on client) | Unit / API tests |
| Dev runner (API) | **tsx watch** | Hot-reload TypeScript server |

### Frontend technologies (storefront & admin)

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | UI components and rendering |
| `vite` | Fast dev server, HMR, production bundling |
| `@vitejs/plugin-react` | React Fast Refresh |
| `typescript` | Static typing |
| `tailwindcss` + `postcss` + `autoprefixer` | Utility CSS pipeline |
| `react-router-dom` | Client-side navigation |
| `@tanstack/react-query` | Async data fetching, caching, retries |
| `react-hook-form` | Performant forms |
| `@hookform/resolvers` + `zod` | Schema-based form validation |
| `@supabase/supabase-js` | Admin login session (and optional client config) |
| `clsx` + `tailwind-merge` | Conditional class names (`cn()` helper) |
| `lucide-react` | Consistent icon set |
| `vite-plugin-pwa` | Manifest + service worker (storefront) |
| `workbox-window` | PWA update / install helpers |

**Storefront-only ideas:** guest cart in `localStorage`, My Orders phone in `localStorage`, tracking token in session, PWA install prompt.

**Admin-only ideas:** JWT stored/synced with Supabase session, protected routes, image upload FormData to API.

### Backend technologies (API)

| Package | Purpose |
|---------|---------|
| `express` | HTTP routing and middleware |
| `zod` | Validate all public/admin inputs |
| `@supabase/supabase-js` | Service-role DB access + `auth.getUser(jwt)` |
| `helmet` | Security headers; CORP set for cross-origin API use |
| `cors` | Reflect allowed origins from `CORS_ORIGIN` |
| `express-rate-limit` | General + order + track/my-orders limits |
| `multer` | Memory upload for product images |
| `dotenv` | Load `server/.env` |
| `pino` / `pino-http` | JSON logs (phones redacted in logger config) |
| `ws` | Polyfill/support for Supabase realtime on older Node |
| `tsx` | Run/watch TypeScript in development |

**API responsibilities:** create orders with server-side price recalculation, tracking, My Orders phone lookup, admin CRUD, status machine, payment/fulfillment updates, settings, image upload to Storage.

### Data & cloud (Supabase)

| Service | How BanaGifts uses it |
|---------|------------------------|
| **Postgres** | Products, categories, orders, settings, notes, history |
| **Auth** | Admin email/password; JWT verified on `/api/admin/*` |
| **Storage** | Public `product-images` bucket for gift photos |
| **RLS** | Policies + `is_admin()`; privileged writes go through Express with service role |

Alternative for demos: **`USE_MOCK_DB=true`** — in-memory store in `server/src/lib/mockDb.ts` (no cloud required).

### Tooling & quality

| Tool | Purpose |
|------|---------|
| `pnpm` | Install once, link workspaces (`@atelier/client`, `@atelier/admin`, `@atelier/server`) |
| `vitest` | Server route tests + client unit tests |
| `@testing-library/react` | Component tests (e.g. Navbar) |
| `supertest` | HTTP assertions against Express app |
| `tsc` | Typecheck / emit server `dist/` |

### Ports & processes (mental model)

```
┌─────────────────┐     /api proxy      ┌──────────────────┐
│  Vite Client    │ ──────────────────► │  Express API     │
│  :5173          │                     │  :4000           │
└─────────────────┘                     └────────┬─────────┘
┌─────────────────┐     /api proxy               │
│  Vite Admin     │ ──────────────────►          │
│  :5175          │                              ▼
└─────────────────┘                     ┌──────────────────┐
                                        │  Supabase Cloud  │
                                        │  DB · Auth · S3  │
                                        └──────────────────┘
```

---

## 4. Why customers have no login

This is intentional for the Ethiopia / phone-first model:

1. **Phone is the identity** — Customers already share their number at checkout and call the shop.
2. **Faster checkout** — No signup, password, or OTP before ordering.
3. **Payment is offline anyway** — Telebirr, CBE Birr, cash, etc. are arranged by phone, not on the site.
4. **Simpler product** — Only the shop admin needs a secure account.
5. **Orders are still findable** — **My Orders** (by phone) and **Track** (by secret token).

Admin authentication uses **Supabase Auth** (email + password + JWT). The API verifies `profiles.role = 'admin'`.

---

## 5. Roles

| Role | App | Auth | What they do |
|------|-----|------|----------------|
| **Customer** | Storefront `:5173` | None (guest) | Browse, cart, checkout, My Orders, track, contact/call |
| **Admin** | Admin `:5175` | Supabase login | Dashboard, orders, products, categories, settings |
| **Supplier** | — | No account | Coordinated by phone; contact stored on the order in admin |
| **Delivery person** | — | No account | Coordinated by phone; name/phone stored on the order in admin |

---

## 6. Customer platform — features & pages

**Base URL (dev):** http://localhost:5173  

Branded as **BanaGifts** with the yellow courier logo (nav, footer, hero, favicon / browser tab, PWA icons).

### Pages

| Route | Page | Functions |
|-------|------|-----------|
| `/` | Home | Hero + brand, featured gifts, how-it-works (browse → request → call → deliver), call CTA |
| `/gifts` | Catalog | Search, category filter, sort, pagination / load more, ETB prices |
| `/gifts/:slug` | Product detail | Description, images, availability, add to cart |
| `/cart` | Cart | Line items, quantity, remove, availability check, sticky checkout |
| `/checkout` | Checkout | Customer & recipient details, phone, **any city/area**, address, date, gift message, consent, submit |
| `/order/confirmation` | Order received | Reference, total, tracking token, **Call shop**, links to track & My Orders |
| `/orders` | **My Orders** | Enter checkout phone → list all orders → expand for details / status history |
| `/track` | Track form | Paste tracking token |
| `/track/:token` | Track status | Public status timeline, items, totals (no private supplier fields) |
| `/contact` | Contact | Primary **Call** button, email, delivery info, lead time |

### Customer features (detail)

- **Guest cart** — Stored in browser `localStorage`
- **ETB formatting** — `en-ET` locale; whole Birr display by default
- **Free-text location** — City/town/area with datalist suggestions (Addis Ababa, Bole, Hawassa, …) from admin settings; not a locked dropdown
- **Phone-first CTAs** — `tel:` links in nav, home, checkout, confirmation, contact, My Orders
- **No online payment** — Policy text explains call-to-confirm
- **Order reference** — Format `BNG-XXXXXX` (e.g. `BNG-4M5S5P`)
- **Tracking token** — 64-char hex; only SHA-256 hash stored in DB
- **My Orders by phone** — Matches `09…` and `+251…` (last 9 digits); remembers phone in `localStorage`
- **Announcement bar** — Yellow brand bar from admin settings
- **PWA** — Installable, offline shell, bottom mobile nav
- **Responsive** — Mobile-first (~360–390px) with sticky cart/checkout actions

### Mobile bottom navigation

Home · Gifts · Cart · **Orders** · Contact  

(Track remains in the top nav / footer.)

---

## 7. Admin platform — features & pages

**Base URL (dev):** http://localhost:5175  

Separate Vite app (not `/admin` on the storefront).

### Pages

| Route | Page | Functions |
|-------|------|-----------|
| `/login` | Sign in | Email/password (Supabase); optional mock login in dev |
| `/` | Dashboard | Counts, paid revenue, recent orders |
| `/orders` | Orders list | Search (reference / name / phone), status & payment filters, pagination |
| `/orders/:id` | Order detail | Full customer data, **click-to-call**, status, payment, fulfillment, notes, history |
| `/products` | Products | Search, category filter, archive, ETB prices |
| `/products/new` | New product | Create product |
| `/products/:id` | Edit product | Update fields, upload images |
| `/categories` | Categories | Create / edit / delete categories |
| `/settings` | Settings | Business name, phone, email, currency, fees, location suggestions, copy |

### Admin order operations

1. **Status** — Controlled transitions:  
   `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered` (or `cancelled`)  
   Invalid jumps are rejected by the API.
2. **Payment** — Status (`unpaid` / `paid` / etc.), amount, method (e.g. Telebirr, CBE Birr, Cash), notes — recorded manually after the phone call.
3. **Fulfillment** — Supplier status/contact/notes; delivery person name & phone; arrangement notes (private — not shown to customers).
4. **Internal notes** — Team-only notes on the order.

### Admin catalog operations

- Create / update / archive products  
- Featured & available flags  
- Image upload to Supabase Storage (`product-images`)  
- Category CRUD  

### Admin settings (power the storefront)

| Key | Purpose |
|-----|---------|
| `business_name` | Brand name (BanaGifts) |
| `tagline` | Short tagline |
| `contact_phone` | Shop phone for all Call buttons |
| `contact_email` | Contact email |
| `currency` | `ETB` |
| `default_delivery_fee` | e.g. 200 |
| `delivery_areas` | Location **suggestions** only |
| `min_lead_time_days` | Minimum days before delivery date |
| `announcement` | Top storefront bar |
| `policy_text` | Checkout policy |
| `privacy_notice` | Privacy blurb |

---

## 8. End-to-end flows

### A. Customer places an order

```
Browse gifts → Add to cart → Checkout
  → Submit order request (server recalculates ETB prices)
  → Confirmation page (BNG-… + tracking token)
  → Customer calls shop
  → Admin confirms gift / place / fee / payment by phone
  → Admin updates status & payment in dashboard
  → Customer checks My Orders or Track
```

### B. Customer finds past orders

1. Open **My Orders** (`/orders`)
2. Enter the phone used at checkout
3. See all matching orders; expand one for line items and status history

### C. Admin fulfills an order

1. Login → Orders → open order  
2. Call customer (`tel:` on phone number)  
3. Mark payment method/amount  
4. Save supplier + delivery person  
5. Advance status through delivery  

---

## 9. Business rules

- **Server-side pricing** — Unit prices come from the database; clients cannot underpay by sending fake prices.
- **Unavailable products** — Cannot be ordered (`PRODUCT_UNAVAILABLE`).
- **Lead time** — Delivery date must respect `min_lead_time_days`.
- **Idempotency** — `Idempotency-Key` on `POST /api/orders` prevents duplicate submits.
- **Public track / My Orders** — Never expose supplier contact, delivery-person phone, or internal notes.
- **Rate limits** — General, order-create, and track/my-orders limiters.
- **Currency default** — ETB on new orders and UI fallbacks.

---

## 10. Architecture

```
Customer browser  →  Storefront (Vite/React :5173)  ─┐
                                                    ├→  Express API (:4000)  →  Supabase
Admin browser     →  Admin (Vite/React :5175)      ─┘         │
                                                              ├ Postgres (orders, products, settings)
                                                              ├ Auth (admin JWT)
                                                              └ Storage (product images)
```

- In development, Vite **proxies** `/api` → `http://localhost:4000`.
- Public catalog may be readable under RLS; **order creation and all admin work go through Express**.
- The Supabase **service role key stays on the server only**.
- Guest tracking stores only the **SHA-256 hash** of the tracking token.

For the full technology list, see [§3 Technologies in detail](#3-technologies-in-detail).

---

## 11. Repository structure

```
banagifts/
├── client/          # Customer storefront (port 5173)
├── admin/           # Admin dashboard (port 5175)
├── server/          # Express API (port 4000)
├── supabase/        # Migrations, seed, config
│   ├── migrations/
│   └── seed.sql
├── docs/            # DEPLOYMENT, SECURITY, SUPABASE
├── package.json     # Workspace scripts
└── README.md
```

---

## 12. API reference

Base path: `/api`

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health + mode (`supabase` / mock) |
| `GET` | `/settings/public` | Public business settings |
| `GET` | `/categories` | Active categories |
| `GET` | `/categories/:slug/products` | Products in a category |
| `GET` | `/products` | Catalog (search, category, featured, sort, page) |
| `GET` | `/products/:slug` | Product detail |
| `POST` | `/orders` | Create order (`Idempotency-Key` optional) |
| `GET` | `/orders/track/:token` | Track by 64-char hex token |
| `POST` | `/orders/my` | Body `{ phone }` → list of customer order summaries |
| `POST` | `/orders/my/detail` | Body `{ phone, order_reference }` → public order detail |

### Admin (Bearer JWT + `profiles.role = admin`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/dashboard` | Summary stats |
| `GET` | `/admin/orders` | List / search / filter |
| `GET` | `/admin/orders/:id` | Full order + items + history + notes |
| `PATCH` | `/admin/orders/:id/status` | Status transition |
| `PATCH` | `/admin/orders/:id/payment` | Payment fields |
| `PATCH` | `/admin/orders/:id/fulfillment` | Supplier / delivery person |
| `POST` | `/admin/orders/:id/notes` | Internal note (`note_text`) |
| `GET/POST/PATCH/DELETE` | `/admin/products`… | Product CRUD + archive |
| `POST` | `/admin/products/:id/images` | Multipart image upload |
| `GET/POST/PATCH/DELETE` | `/admin/categories`… | Category CRUD |
| `GET/PATCH` | `/admin/settings` | Read / update settings |

---

## 13. Database & storage

### Main tables

- `profiles` — Auth user ↔ `admin` / `customer` role  
- `business_settings` — Key/value JSON settings  
- `categories` / `products` / `product_images`  
- `orders` / `order_items` / `order_status_history` / `order_notes`  

### Storage

- Bucket: `product-images` (public read; admin upload via API)  
- Allowed types: jpeg, png, webp, gif (size limit configured in migration)

### Seed (dev only)

`supabase/seed.sql` — BanaGifts settings, ETB prices, demo catalog. **Do not run on production.**

---

## 14. Environment variables

> Step-by-step run instructions are in [§2 How to run](#2-how-to-run-step-by-step).

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `NODE_ENV` | `development` / `test` / `production` |
| `CORS_ORIGIN` | Comma-separated origins (include `localhost` and `127.0.0.1` for both apps) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server only |
| `USE_MOCK_DB` | `true` = in-memory demo DB |
| `RATE_LIMIT_WINDOW_MS` | Window for rate limits |
| `RATE_LIMIT_MAX` | General API max |
| `ORDER_RATE_LIMIT_MAX` | Max order creates per window |
| `TRACK_RATE_LIMIT_MAX` | Max track / my-orders lookups |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Empty = use `/api` (Vite proxy) |
| `VITE_SUPABASE_URL` | Optional for storefront |
| `VITE_SUPABASE_ANON_KEY` | Optional for storefront |
| `VITE_USE_MOCK_AUTH` | Not used for guest storefront |

### Admin (`admin/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Empty = `/api` proxy |
| `VITE_SUPABASE_URL` | Required for real login |
| `VITE_SUPABASE_ANON_KEY` | Required for real login |
| `VITE_USE_MOCK_AUTH` | `true` = mock admin token (dev) |
| `VITE_STOREFRONT_URL` | “View storefront” link |

**Never commit real `.env` files.** Only `*.env.example` files are in git.

---

## 15. Supabase setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).  
2. Apply migrations:

```bash
# Linked CLI:
supabase db push

# Or run in SQL Editor:
# supabase/migrations/20261013120000_initial_schema.sql
# supabase/migrations/20261013140000_ethiopia_etb_defaults.sql
```

3. Optionally seed **dev only:** `supabase/seed.sql`  
4. Configure server/client/admin env with project URL and keys.  
5. Confirm Storage bucket `product-images` exists.

More detail: [docs/SUPABASE.md](docs/SUPABASE.md).

---

## 16. First admin account

There is **no public admin registration**.

1. Create a user in Supabase Auth (Dashboard → Authentication → Users).  
2. Promote in SQL:

```sql
UPDATE public.profiles
SET role = 'admin',
    full_name = 'Your Name',
    updated_at = now()
WHERE id = '<auth-user-uuid>';
```

3. Sign in at http://localhost:5175/login  

Change the default password before going live. Rotate the service role key if it was ever exposed.

---

## 17. Scripts, tests & builds

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspaces |
| `pnpm dev` | Parallel client + server (see also `dev:admin`) |
| `pnpm dev:client` | Storefront |
| `pnpm dev:admin` | Admin |
| `pnpm dev:server` | API |
| `pnpm build` | Production builds |
| `pnpm test` | All package tests |
| `pnpm typecheck` | TypeScript checks |

```bash
pnpm --filter @atelier/server test
pnpm --filter @atelier/client test
pnpm --filter @atelier/server build
pnpm --filter @atelier/client build
# Admin: pnpm --filter @atelier/admin build
```

---

## 18. PWA

The storefront is a Progressive Web App:

- Manifest name: **BanaGifts — Gifts in Ethiopia**
- Theme / background: brand yellow `#FFD100`
- Service worker via `vite-plugin-pwa`
- Offline shell for static assets; network-first for `/api`
- Install prompt + Apple touch icon + standalone mode  

Production: serve `client/dist` over **HTTPS**.

---

## 19. Design & branding

- **Brand:** BanaGifts  
- **Logo:** Yellow background, black courier with cloche (fast delivery)  
- **UI:** Warm ivory / espresso / wine accent; Cormorant Garamond + Source Sans 3  
- **Announcement bar:** Brand yellow  
- **Phone-first:** Call buttons and `tel:` links as primary actions  

Configurable brand strings live in **Admin → Settings** (`business_name`, phone, announcement, etc.).

---

## 20. Security notes

- Service role key **only on the server**  
- Admin routes require verified JWT + `admin` role  
- Tracking tokens hashed at rest (SHA-256)  
- My Orders by phone: anyone who knows that number can list those orders (acceptable for this trust model; don’t put secrets in customer-visible fields)  
- Rate limiting on order create and lookups  
- Helmet + CORS configured for storefront and admin origins  
- See [docs/SECURITY.md](docs/SECURITY.md)

---

## 21. Deployment

High level:

1. Apply migrations to production Supabase (**no** demo seed).  
2. Deploy API (`USE_MOCK_DB=false`, secrets via env).  
3. Build & host storefront and admin static apps; reverse-proxy `/api` or set `VITE_API_BASE_URL`.  
4. Set `CORS_ORIGIN` to real origins.  
5. Put the real shop phone in Settings.  
6. Back up Postgres regularly.  

Details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 22. What is intentionally out of scope

| Not included | Why |
|--------------|-----|
| Online payment gateway | Phone / Telebirr / cash confirmation model |
| Customer accounts | Guest + phone identity |
| Supplier or driver apps | Admin coordinates by phone |
| SMS / WhatsApp automation | Can be added later |
| Multi-shop marketplace | Single boutique |

---

## Feature checklist (summary)

### Customer
- [x] Home, catalog, product detail  
- [x] Cart & guest checkout  
- [x] Any Ethiopia delivery location  
- [x] ETB prices & fees  
- [x] Order confirmation + call CTA  
- [x] My Orders (phone lookup)  
- [x] Track by token  
- [x] Contact / call shop  
- [x] PWA + mobile bottom nav  
- [x] BanaGifts branding & logo  

### Admin
- [x] Secure login  
- [x] Dashboard  
- [x] Orders (search, status, payment, fulfillment, notes)  
- [x] Products + image upload  
- [x] Categories  
- [x] Business settings driving the storefront  

### Platform
- [x] Express API + Zod validation  
- [x] Supabase Postgres / Auth / Storage  
- [x] Mock DB mode for local demos  
- [x] Idempotent order create  
- [x] Rate limits  
- [x] Automated tests (server + client)  

---

## License

Private project — all rights reserved unless otherwise stated.
