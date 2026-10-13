# BanaGifts — Gift Discovery & Delivery Platform

A gift delivery platform for Ethiopia: customer storefront + admin dashboard. Prices in Ethiopian Birr (ETB). Customers pick any delivery location, submit an order request, then call the shop to confirm gift, place, fee, and payment. No online payment gateway.

**Roles:** Customer (guest checkout) and Admin only. Delivery people and suppliers have no accounts.

**Payments:** Handled outside the app by phone. The admin records payment status manually. There is no payment gateway.

---

## Architecture

```
client/     React storefront (port 5173)
admin/      React admin dashboard (port 5175)
server/     Express API (port 4000)
supabase/   SQL migrations, seed data, storage policies
docs/       Setup and security notes
```

- Public catalog data may be read under RLS; **all order creation and privileged work goes through the Express API**.
- The Supabase **service role key stays on the server only**.
- Guest order tracking uses a high-entropy token; only the SHA-256 hash is stored.

---

## Prerequisites

- Node.js 18+ (Node 22+ recommended for current `@supabase/supabase-js`)
- pnpm 9+
- A Supabase project (for production / real DB). Local mock mode works without Supabase.

---

## Quick start (mock mode — no Supabase required)

```bash
# From repository root
pnpm install

cp server/.env.example server/.env
cp client/.env.example client/.env
cp admin/.env.example admin/.env

# Terminal 1 — API on :4000
pnpm dev:server

# Terminal 2 — customer storefront on :5173
pnpm dev:client

# Terminal 3 — admin dashboard on :5175
pnpm dev:admin
```

| App | URL | npm (from that folder) |
|-----|-----|-------------------------|
| Storefront | http://localhost:5173 | `cd client && npm run dev` |
| Admin | http://localhost:5175 | `cd admin && npm run dev` |
| API | http://localhost:4000 | `cd server && npm run dev` |

Admin is a **separate website** on port **5175** (not `/admin` on the storefront).

---

## Environment variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `NODE_ENV` | `development` / `test` / `production` |
| `CORS_ORIGIN` | Allowed origins (comma-separated storefront + admin) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anon key (server may use for user JWT verification) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — never expose to the browser |
| `USE_MOCK_DB` | `true` = in-memory store with demo catalog |
| `RATE_LIMIT_*` | General / order / track rate limits |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Leave empty to use relative `/api` (Vite proxy) |
| `VITE_SUPABASE_URL` | Supabase URL for admin Auth |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `VITE_USE_MOCK_AUTH` | `true` enables Dev login with mock admin token |

See `server/.env.example` and `client/.env.example`. **Never commit real secrets.**

---

## Supabase setup

Supabase MCP was **not connected** in the build environment. Apply migrations yourself:

### 1. Create a project

Create a project in the [Supabase dashboard](https://supabase.com/dashboard).

### 2. Apply the migration

In the SQL Editor (or via Supabase CLI):

```bash
# If using Supabase CLI linked to your project:
supabase db push
# or run the file contents:
# supabase/migrations/20261013120000_initial_schema.sql
```

This creates tables, enums, RLS policies, `is_admin()`, auth profile trigger, and the `product-images` storage bucket (public read, admin write).

### 3. Seed demo data (development only)

Run `supabase/seed.sql` **only** on development databases. It inserts placeholder business settings (`hello@example.com`, `+10000000000`) and demo products. Do **not** treat this as production content.

### 4. Configure env

Set `USE_MOCK_DB=false` and fill `SUPABASE_*` keys on the server. Set client Supabase URL + anon key and `VITE_USE_MOCK_AUTH=false`.

### 5. Storage

The migration creates bucket `product-images` (5 MB, jpeg/png/webp/gif). Admins upload via `POST /api/admin/products/:id/images`.

---

## First admin (secure bootstrap)

There is **no public admin registration**.

1. Create a user in Supabase Auth (Dashboard → Authentication → Users → Add user), or sign up once via a temporary Auth flow you control.
2. Promote that user in SQL:

```sql
UPDATE public.profiles
SET role = 'admin',
    full_name = 'Your Name',
    updated_at = now()
WHERE id = '<auth-user-uuid>';
```

3. Sign in at `/admin/login` with that email and password.

The API checks `profiles.role = 'admin'` after verifying the JWT — never trust a role from the frontend.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Client + server in parallel |
| `pnpm dev:client` | Vite storefront |
| `pnpm dev:server` | Express API |
| `pnpm build` | Production builds |
| `pnpm test` | All package tests |
| `pnpm typecheck` | TypeScript checks |

---

## API overview

**Public:** `GET /api/health`, products, categories, public settings, `POST /api/orders`, `GET /api/orders/track/:token`

**Admin (Bearer JWT):** dashboard, orders (status / payment / fulfillment / notes), products (+ images), categories, settings

Orders recalculate prices on the server, reject unavailable products, support `Idempotency-Key`, and never expose internal notes or delivery-person details on the public tracking endpoint.

---

## Testing & builds (verified)

```bash
pnpm --filter @atelier/server test     # 34 tests
pnpm --filter @atelier/client test     # 37 tests
pnpm --filter @atelier/server build
pnpm --filter @atelier/client build
```

---

## Deployment notes

1. Apply migrations to production Supabase; **do not** run demo seed.
2. Deploy `server` (Node) with production env and `USE_MOCK_DB=false`.
3. Build and host `client` (`pnpm --filter @atelier/client build` → `client/dist`). Point the API base URL or reverse-proxy `/api` to the server.
4. Set `CORS_ORIGIN` to the real frontend origin.
5. Rotate and restrict the service role key; enable Supabase Auth email confirmations as appropriate.
6. Back up the Postgres database regularly.

See [docs/SECURITY.md](docs/SECURITY.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Progressive Web App (storefront)

The customer storefront is installable as a PWA:

- Web app manifest + service worker (via `vite-plugin-pwa`)
- Offline shell caching for static assets
- Network-first caching for `/api` catalog reads
- Mobile bottom navigation, safe-area insets, and home-screen install prompt
- Apple touch icon + standalone display mode

After `pnpm --filter @atelier/client build`, serve `client/dist` over **HTTPS** (required for install on most phones). In development, PWA is enabled with `devOptions.enabled`.

## Design

Warm ivory / espresso / deep wine editorial boutique UI (Cormorant Garamond + Source Sans 3). Phone-first UX with `tel:` CTAs. Configurable business name, phone, ETB currency, delivery fee, and location suggestions via admin settings. Customers may type any city/area in Ethiopia. Mobile storefront layouts target ~360–390px widths with sticky checkout/cart actions above the bottom nav.

---

## License

Private project — all rights reserved unless otherwise stated.
