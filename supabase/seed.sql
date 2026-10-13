-- DEMO SEED DATA — for development only. Do not run against production.
-- Localized for Ethiopia: ETB prices, phone-first copy, free-text delivery locations.

INSERT INTO public.business_settings (key, value) VALUES
  ('business_name', '"BanaGifts"'::jsonb),
  ('tagline', '"Gifts across Ethiopia — confirmed by phone"'::jsonb),
  ('contact_phone', '"+251911000000"'::jsonb),
  ('contact_email', '"hello@banagifts.et"'::jsonb),
  ('currency', '"ETB"'::jsonb),
  ('default_delivery_fee', '200'::jsonb),
  ('delivery_areas', '["Addis Ababa", "Bole", "Piassa", "CMC", "Kazanchis", "Saris", "Lebu", "Ayat", "Adama", "Bahir Dar", "Hawassa", "Dire Dawa", "Mekelle", "Jimma", "Gondar"]'::jsonb),
  ('min_lead_time_days', '1'::jsonb),
  ('announcement', '"Order online, then call us to confirm. Prices in Ethiopian Birr (ETB). Delivery to any location we can arrange."'::jsonb),
  ('privacy_notice', '"We use your phone number only to confirm and deliver your gift order. We do not sell personal information."'::jsonb),
  ('policy_text', '"After you submit an order, call the shop to confirm the gift, delivery place, price in ETB, and payment. Nothing is charged on this website."'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

INSERT INTO public.categories (id, name, slug, description, image_path, sort_order, is_active) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Flowers', 'flowers', 'Seasonal bouquets and arranged blooms.', 'demo/categories/flowers.jpg', 1, true),
  ('a1000000-0000-4000-8000-000000000002', 'Gift Boxes', 'gift-boxes', 'Curated boxes ready to give.', 'demo/categories/gift-boxes.jpg', 2, true),
  ('a1000000-0000-4000-8000-000000000003', 'Chocolates & Sweets', 'chocolates-sweets', 'Artisan chocolates and confections.', 'demo/categories/chocolates.jpg', 3, true),
  ('a1000000-0000-4000-8000-000000000004', 'Birthday', 'birthday', 'Gifts chosen for birthdays.', 'demo/categories/birthday.jpg', 4, true),
  ('a1000000-0000-4000-8000-000000000005', 'Anniversary', 'anniversary', 'Quietly elegant anniversary selections.', 'demo/categories/anniversary.jpg', 5, true),
  ('a1000000-0000-4000-8000-000000000006', 'Graduation', 'graduation', 'Congratulations-worthy gifts.', 'demo/categories/graduation.jpg', 6, true),
  ('a1000000-0000-4000-8000-000000000007', 'Personalized', 'personalized', 'Items we can arrange with a personal touch.', 'demo/categories/personalized.jpg', 7, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, is_available, is_featured) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Garden Rose Bouquet', 'garden-rose-bouquet',
   'A generous hand-tied bouquet of garden roses in soft blush and ivory, finished with linen ribbon.', 2800.00, true, true),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Wild Meadow Arrangement', 'wild-meadow-arrangement',
   'Seasonal wildflowers loosely arranged in a ceramic vessel — airy, informal, and bright.', 2200.00, true, true),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'Evening Indulgence Box', 'evening-indulgence-box',
   'Dark chocolate, honeycomb, and a small candle nestled in kraft and tissue.', 3200.00, true, true),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'Morning Ritual Set', 'morning-ritual-set',
   'Loose-leaf tea, honey spoon, and a linen napkin — a gentle start.', 1800.00, true, false),
  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', 'Single Origin Truffles', 'single-origin-truffles',
   'Twelve hand-rolled truffles from a single cacao origin, boxed for gifting.', 1500.00, true, true),
  ('b1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003', 'Caramel Sea Salt Collection', 'caramel-sea-salt-collection',
   'Soft caramels finished with flaky sea salt in a slim gift tin.', 1200.00, true, false),
  ('b1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004', 'Birthday Bloom & Treat', 'birthday-bloom-and-treat',
   'A cheerful mixed bouquet paired with a small cake-slice chocolate bar.', 2600.00, true, true),
  ('b1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000005', 'Anniversary Keepsake Duo', 'anniversary-keepsake-duo',
   'Two stem roses with a bottle of sparkling non-alcoholic aperitif and a handwritten card option.', 3800.00, true, true),
  ('b1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000006', 'Graduate Desk Set', 'graduate-desk-set',
   'A leather notebook, pen, and congratulatory card arranged in a presentation box.', 2400.00, true, false),
  ('b1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000007', 'Monogram Candle & Match Set', 'monogram-candle-match-set',
   'Soy candle with optional monogram on the lid card, plus a brass match striker.', 1600.00, true, false),
  ('b1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000004', 'Celebration Balloon Cluster', 'celebration-balloon-cluster',
   'A refined cluster of matte balloons with a weight — available while stock lasts.', 900.00, false, false),
  ('b1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000002', 'Hostess Welcome Tray', 'hostess-welcome-tray',
   'Crackers, olives, and a small cheese knife on a reusable wooden board.', 2700.00, true, false)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_available = EXCLUDED.is_available,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO public.product_images (product_id, storage_path, alt_text, sort_order) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'demo/products/garden-rose-bouquet.jpg', 'Garden rose bouquet with linen ribbon', 0),
  ('b1000000-0000-4000-8000-000000000002', 'demo/products/wild-meadow.jpg', 'Wild meadow flower arrangement', 0),
  ('b1000000-0000-4000-8000-000000000003', 'demo/products/evening-indulgence.jpg', 'Evening indulgence gift box', 0),
  ('b1000000-0000-4000-8000-000000000004', 'demo/products/morning-ritual.jpg', 'Morning ritual tea set', 0),
  ('b1000000-0000-4000-8000-000000000005', 'demo/products/truffles.jpg', 'Single origin chocolate truffles', 0),
  ('b1000000-0000-4000-8000-000000000006', 'demo/products/caramels.jpg', 'Caramel sea salt gift tin', 0),
  ('b1000000-0000-4000-8000-000000000007', 'demo/products/birthday-bloom.jpg', 'Birthday bloom and treat', 0),
  ('b1000000-0000-4000-8000-000000000008', 'demo/products/anniversary-duo.jpg', 'Anniversary keepsake duo', 0),
  ('b1000000-0000-4000-8000-000000000009', 'demo/products/graduate-desk.jpg', 'Graduate desk set', 0),
  ('b1000000-0000-4000-8000-000000000010', 'demo/products/monogram-candle.jpg', 'Monogram candle and match set', 0),
  ('b1000000-0000-4000-8000-000000000011', 'demo/products/balloons.jpg', 'Celebration balloon cluster', 0),
  ('b1000000-0000-4000-8000-000000000012', 'demo/products/hostess-tray.jpg', 'Hostess welcome tray', 0)
ON CONFLICT DO NOTHING;
