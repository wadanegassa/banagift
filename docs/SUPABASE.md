# Supabase configuration checklist

## MCP status

No Supabase MCP server was available in the environment where this application was built. Migrations and seed files live in the repository and must be applied with the Supabase CLI or SQL Editor.

## Migration file

`supabase/migrations/20261013120000_initial_schema.sql`

Creates:

- Enums: `user_role`, `order_status`, `payment_status`, `supplier_status`
- Tables: `profiles`, `categories`, `products`, `product_images`, `business_settings`, `orders`, `order_items`, `order_status_history`, `order_notes`
- Triggers: `updated_at`, `handle_new_user` on `auth.users`
- Function: `is_admin()`
- RLS policies
- Storage bucket `product-images` + policies

## Applying with CLI

```bash
# Install CLI, then from repo root:
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste the migration SQL into the Dashboard SQL Editor and run it once.

## Seed (dev only)

```bash
# Via psql / SQL Editor — development databases only
# File: supabase/seed.sql
```

## Verifying RLS

After apply, confirm in Dashboard → Authentication / Table Editor that:

- Anon cannot `select * from orders`
- Anon can read active categories / available products
- An admin JWT can manage catalog tables per policy

## Promoting an admin

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<uuid from auth.users>';
```
