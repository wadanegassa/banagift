-- Product stock quantities + atomic reserve/restore helpers for order flows.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_nonneg;

ALTER TABLE public.products
  ADD CONSTRAINT products_stock_nonneg CHECK (stock_quantity >= 0);

-- Backfill sensible demo stock for existing catalog rows.
UPDATE public.products
SET stock_quantity = CASE
  WHEN is_available = false THEN 0
  WHEN slug = 'hostess-welcome-tray' THEN 3
  WHEN slug IN ('garden-rose-bouquet', 'evening-indulgence-box', 'anniversary-keepsake-duo') THEN 15
  WHEN slug IN ('wild-meadow-arrangement', 'birthday-bloom-and-treat', 'single-origin-truffles') THEN 20
  ELSE 12
END
WHERE stock_quantity = 0 AND is_available = true;

UPDATE public.products
SET stock_quantity = 0
WHERE is_available = false AND stock_quantity <> 0;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_id uuid, p_qty integer)
RETURNS public.products
LANGUAGE plpgsql
AS $$
DECLARE
  row public.products;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN
    RAISE EXCEPTION 'INVALID_STOCK_QTY';
  END IF;

  UPDATE public.products
  SET
    stock_quantity = stock_quantity - p_qty,
    is_available = CASE WHEN stock_quantity - p_qty <= 0 THEN false ELSE is_available END,
    updated_at = now()
  WHERE id = p_id
    AND archived_at IS NULL
    AND stock_quantity >= p_qty
  RETURNING * INTO row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK';
  END IF;

  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_product_stock(p_id uuid, p_qty integer)
RETURNS public.products
LANGUAGE plpgsql
AS $$
DECLARE
  row public.products;
  was_empty boolean;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN
    RAISE EXCEPTION 'INVALID_STOCK_QTY';
  END IF;

  SELECT stock_quantity = 0 INTO was_empty
  FROM public.products
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  UPDATE public.products
  SET
    stock_quantity = stock_quantity + p_qty,
    is_available = CASE
      WHEN archived_at IS NOT NULL THEN false
      WHEN was_empty THEN true
      ELSE is_available
    END,
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO row;

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_product_stock(uuid, integer) TO service_role;
