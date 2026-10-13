# Security assumptions and production checklist

## Trust boundaries

- The browser is untrusted. Prices, totals, roles, payment states, and availability flags from the client are never authoritative.
- Privileged operations run only on the Express server using the Supabase **service role** key (or the in-memory mock store in development).
- Admin authorization: valid Supabase JWT **and** `profiles.role = 'admin'` in the database.
- Guest customers do not have accounts. They create orders via `POST /api/orders` and look them up with a tracking token.

## Order tracking

- On create, the server generates a 32-byte random token (64 hex chars).
- Only `sha256(token)` is stored (`orders.tracking_token_hash`).
- The plaintext token is returned once in the create response and should be saved by the customer (confirmation page / sessionStorage).
- Tracking responses omit: internal notes, supplier contacts, delivery-person phone/name, payment notes, token hashes.

## Row Level Security

- RLS is enabled on all application tables.
- Anon/authenticated users may read **active** categories and **available, non-archived** products and their images.
- Orders, order items, history, notes, and business settings are **not** readable by the public Data API; the server mediates access.
- Admins use `is_admin()` policies for catalog management when using the user JWT; the service role bypasses RLS for server workflows.

## Abuse controls

- Helmet security headers
- CORS restricted to `CORS_ORIGIN`
- JSON body limit 1 MB
- Rate limits on general `/api`, order creation, and tracking
- Idempotency-Key support on order creation
- Zod validation on all mutating inputs
- Centralized errors without stack traces in production
- Structured logging with PII redaction (phones, addresses, notes)

## Secrets

Never commit:

- `SUPABASE_SERVICE_ROLE_KEY`
- Database passwords
- Production `.env` files

Never put the service role key in `VITE_*` variables or frontend bundles.

## First admin

No self-serve admin signup. Promote a user via SQL after Auth user creation (see README).

## Status transitions

Only forward (or cancel) transitions are allowed:

`pending` → `confirmed` | `cancelled`  
`confirmed` → `preparing` | `cancelled`  
`preparing` → `out_for_delivery` | `cancelled`  
`out_for_delivery` → `delivered` | `cancelled`  
`delivered` / `cancelled` → terminal

Payment status is updated separately and is never auto-set to `paid` by an order-status change.
