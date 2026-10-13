-- Atelier Gifts — initial schema, RLS, storage policies
-- Safe to apply on empty projects. Non-destructive for existing auth.users.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'unpaid',
    'pending_confirmation',
    'paid',
    'partially_paid',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.supplier_status AS ENUM (
    'not_contacted',
    'awaiting_supplier',
    'confirmed',
    'unavailable'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Profiles (admin auth users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'customer',
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin'))
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_unique UNIQUE (slug),
  CONSTRAINT categories_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS categories_active_sort_idx
  ON public.categories(is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_slug_unique UNIQUE (slug),
  CONSTRAINT products_price_nonneg CHECK (price >= 0),
  CONSTRAINT products_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(is_featured) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS products_available_idx ON public.products(is_available) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS products_created_idx ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS products_search_idx ON public.products
  USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- ---------------------------------------------------------------------------
-- Product images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_product_sort_idx
  ON public.product_images(product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Business settings (typed key/value)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference TEXT NOT NULL,
  tracking_token_hash TEXT NOT NULL,
  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  -- Recipient
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  -- Delivery
  city TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time_window TEXT,
  delivery_instructions TEXT,
  gift_message TEXT,
  special_request TEXT,
  -- Statuses
  order_status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  supplier_status public.supplier_status NOT NULL DEFAULT 'not_contacted',
  -- Money
  subtotal NUMERIC(12, 2) NOT NULL,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_notes TEXT,
  payment_confirmed_at TIMESTAMPTZ,
  -- Fulfillment (private)
  supplier_contact TEXT,
  supplier_notes TEXT,
  delivery_person_name TEXT,
  delivery_person_phone TEXT,
  delivery_arrangement_notes TEXT,
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Idempotency
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_reference_unique UNIQUE (order_reference),
  CONSTRAINT orders_tracking_hash_unique UNIQUE (tracking_token_hash),
  CONSTRAINT orders_idempotency_unique UNIQUE (idempotency_key),
  CONSTRAINT orders_subtotal_nonneg CHECK (subtotal >= 0),
  CONSTRAINT orders_delivery_fee_nonneg CHECK (delivery_fee >= 0),
  CONSTRAINT orders_total_nonneg CHECK (total >= 0),
  CONSTRAINT orders_amount_paid_nonneg CHECK (amount_paid >= 0),
  CONSTRAINT orders_customer_name_not_empty CHECK (char_length(trim(customer_name)) > 0),
  CONSTRAINT orders_recipient_name_not_empty CHECK (char_length(trim(recipient_name)) > 0)
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS orders_payment_idx ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_delivery_date_idx ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS orders_reference_idx ON public.orders(order_reference);

-- ---------------------------------------------------------------------------
-- Order items (snapshots)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image_path TEXT,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_subtotal NUMERIC(12, 2) NOT NULL,
  CONSTRAINT order_items_qty_positive CHECK (quantity > 0),
  CONSTRAINT order_items_price_nonneg CHECK (unit_price >= 0),
  CONSTRAINT order_items_line_nonneg CHECK (line_subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);

-- ---------------------------------------------------------------------------
-- Order status history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status public.order_status,
  new_status public.order_status NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_idx
  ON public.order_status_history(order_id, created_at);

-- ---------------------------------------------------------------------------
-- Order notes (admin-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT order_notes_text_not_empty CHECK (char_length(trim(note_text)) > 0)
);

CREATE INDEX IF NOT EXISTS order_notes_order_idx
  ON public.order_notes(order_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS business_settings_set_updated_at ON public.business_settings;
CREATE TRIGGER business_settings_set_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: create profile on signup (role stays customer by default)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'customer',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));

-- Categories: public read active; admin full access via service role / server
DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_admin_all ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Products: public read non-archived available listing (server still mediates)
DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read ON public.products
  FOR SELECT TO anon, authenticated
  USING (archived_at IS NULL AND is_available = true);

DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_admin_all ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product images
DROP POLICY IF EXISTS product_images_public_read ON public.product_images;
CREATE POLICY product_images_public_read ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.archived_at IS NULL AND p.is_available = true
    )
  );

DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;
CREATE POLICY product_images_admin_all ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Business settings: public may read a limited allowlist of keys via server;
-- direct public SELECT disabled. Admins can read/write.
DROP POLICY IF EXISTS business_settings_admin_all ON public.business_settings;
CREATE POLICY business_settings_admin_all ON public.business_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders: NO public/anon access via Data API. Server uses service role.
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;
CREATE POLICY order_items_admin_all ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS order_status_history_admin_all ON public.order_status_history;
CREATE POLICY order_status_history_admin_all ON public.order_status_history
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS order_notes_admin_all ON public.order_notes;
CREATE POLICY order_notes_admin_all ON public.order_notes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket for product images
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS product_images_storage_public_read ON storage.objects;
CREATE POLICY product_images_storage_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_storage_admin_insert ON storage.objects;
CREATE POLICY product_images_storage_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS product_images_storage_admin_update ON storage.objects;
CREATE POLICY product_images_storage_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS product_images_storage_admin_delete ON storage.objects;
CREATE POLICY product_images_storage_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
