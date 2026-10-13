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
2. [Why customers have no login](#2-why-customers-have-no-login)
3. [Roles](#3-roles)
4. [Customer platform — features & pages](#4-customer-platform--features--pages)
5. [Admin platform — features & pages](#5-admin-platform--features--pages)
6. [End-to-end flows](#6-end-to-end-flows)
7. [Business rules](#7-business-rules)
8. [Architecture & tech stack](#8-architecture--tech-stack)
9. [Repository structure](#9-repository-structure)
10. [API reference](#10-api-reference)
11. [Database & storage](#11-database--storage)
12. [Local development](#12-local-development)
13. [Environment variables](#13-environment-variables)
14. [Supabase setup](#14-supabase-setup)
15. [First admin account](#15-first-admin-account)
16. [Scripts, tests & builds](#16-scripts-tests--builds)
17. [PWA](#17-pwa)
18. [Design & branding](#18-design--branding)
19. [Security notes](#19-security-notes)
20. [Deployment](#20-deployment)
21. [What is intentionally out of scope](#21-what-is-intentionally-out-of-scope)

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

## 2. Why customers have no login

This is intentional for the Ethiopia / phone-first model:

1. **Phone is the identity** — Customers already share their number at checkout and call the shop.
2. **Faster checkout** — No signup, password, or OTP before ordering.
3. **Payment is offline anyway** — Telebirr, CBE Birr, cash, etc. are arranged by phone, not on the site.
4. **Simpler product** — Only the shop admin needs a secure account.
5. **Orders are still findable** — **My Orders** (by phone) and **Track** (by secret token).

Admin authentication uses **Supabase Auth** (email + password + JWT). The API verifies `profiles.role = 'admin'`.

---

## 3. Roles

| Role | App | Auth | What they do |
|------|-----|------|----------------|
| **Customer** | Storefront `:5173` | None (guest) | Browse, cart, checkout, My Orders, track, contact/call |
| **Admin** | Admin `:5175` | Supabase login | Dashboard, orders, products, categories, settings |
| **Supplier** | — | No account | Coordinated by phone; contact stored on the order in admin |
| **Delivery person** | — | No account | Coordinated by phone; name/phone stored on the order in admin |

---

## 4. Customer platform — features & pages

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

## 5. Admin platform — features & pages

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

## 6. End-to-end flows

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

## 7. Business rules

- **Server-side pricing** — Unit prices come from the database; clients cannot underpay by sending fake prices.
- **Unavailable products** — Cannot be ordered (`PRODUCT_UNAVAILABLE`).
- **Lead time** — Delivery date must respect `min_lead_time_days`.
- **Idempotency** — `Idempotency-Key` on `POST /api/orders` prevents duplicate submits.
- **Public track / My Orders** — Never expose supplier contact, delivery-person phone, or internal notes.
- **Rate limits** — General, order-create, and track/my-orders limiters.
- **Currency default** — ETB on new orders and UI fallbacks.

---

## 8. Architecture & tech stack

```
Customer browser  →  Storefront (Vite/React :5173)  ─┐
                                                    ├→  Express API (:4000)  →  Supabase
Admin browser     →  Admin (Vite/React :5175)      ─┘         │
                                                              ├ Postgres (orders, products, settings)
                                                              ├ Auth (admin JWT)
                                                              └ Storage (product images)
```

In development, Vite **proxies** `/api` → `http://localhost:4000`, so the browser uses same-origin `/api/...`.

| Layer | Technology |
|-------|------------|
| Storefront | React, TypeScript, Vite, Tailwind, React Router, TanStack Query, React Hook Form + Zod, PWA |
| Admin | Same stack + Supabase Auth client |
| API | Node.js, Express, Zod, Helmet, CORS, express-rate-limit, Pino |
| Data | Supabase Postgres, RLS, Storage |
| Money / dates | `Intl` with `ETB` / `en-ET` |
| Monorepo | pnpm workspaces |
| Tests | Vitest |

---

## 9. Repository structure

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

## 10. API reference

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

## 11. Database & storage

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

## 12. Local development

### Prerequisites

- Node.js **18+** (22+ recommended)
- **pnpm** 9+
- Optional: Supabase project (or use mock DB)

### Quick start (mock mode)

```bash
pnpm install

cp server/.env.example server/.env
cp client/.env.example client/.env
cp admin/.env.example admin/.env

# Three terminals:
pnpm dev:server    # :4000
pnpm dev:client    # :5173
pnpm dev:admin     # :5175
```

Or from each folder: `npm run dev`.

| App | URL |
|-----|-----|
| Storefront | http://localhost:5173 |
| Admin | http://localhost:5175 |
| API | http://localhost:4000/api/health |

### Live Supabase mode

Set `USE_MOCK_DB=false` and fill `SUPABASE_*` in `server/.env`. Set matching `VITE_SUPABASE_*` in `client/.env` and `admin/.env`. Set `VITE_USE_MOCK_AUTH=false`.

---

## 13. Environment variables

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

## 14. Supabase setup

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

## 15. First admin account

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

## 16. Scripts, tests & builds

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

## 17. PWA

The storefront is a Progressive Web App:

- Manifest name: **BanaGifts — Gifts in Ethiopia**
- Theme / background: brand yellow `#FFD100`
- Service worker via `vite-plugin-pwa`
- Offline shell for static assets; network-first for `/api`
- Install prompt + Apple touch icon + standalone mode  

Production: serve `client/dist` over **HTTPS**.

---

## 18. Design & branding

- **Brand:** BanaGifts  
- **Logo:** Yellow background, black courier with cloche (fast delivery)  
- **UI:** Warm ivory / espresso / wine accent; Cormorant Garamond + Source Sans 3  
- **Announcement bar:** Brand yellow  
- **Phone-first:** Call buttons and `tel:` links as primary actions  

Configurable brand strings live in **Admin → Settings** (`business_name`, phone, announcement, etc.).

---

## 19. Security notes

- Service role key **only on the server**  
- Admin routes require verified JWT + `admin` role  
- Tracking tokens hashed at rest (SHA-256)  
- My Orders by phone: anyone who knows that number can list those orders (acceptable for this trust model; don’t put secrets in customer-visible fields)  
- Rate limiting on order create and lookups  
- Helmet + CORS configured for storefront and admin origins  
- See [docs/SECURITY.md](docs/SECURITY.md)

---

## 20. Deployment

High level:

1. Apply migrations to production Supabase (**no** demo seed).  
2. Deploy API (`USE_MOCK_DB=false`, secrets via env).  
3. Build & host storefront and admin static apps; reverse-proxy `/api` or set `VITE_API_BASE_URL`.  
4. Set `CORS_ORIGIN` to real origins.  
5. Put the real shop phone in Settings.  
6. Back up Postgres regularly.  

Details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 21. What is intentionally out of scope

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
