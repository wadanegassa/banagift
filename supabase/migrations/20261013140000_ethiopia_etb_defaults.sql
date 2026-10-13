-- Ethiopia / ETB defaults for live gift delivery platform.
-- Customers type any delivery location; currency defaults to Ethiopian Birr.

ALTER TABLE public.orders
  ALTER COLUMN currency SET DEFAULT 'ETB';

UPDATE public.orders
SET currency = 'ETB'
WHERE currency IS NULL OR currency = 'USD';
