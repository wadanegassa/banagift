import { randomUUID } from 'node:crypto';
import type {
  BusinessSettingsMap,
  Category,
  Order,
  OrderItem,
  OrderNote,
  OrderStatusHistoryEntry,
  Product,
  ProductImage,
  UserRole,
} from '../types/models.js';

// ---------------------------------------------------------------------------
// In-memory data store used when USE_MOCK_DB=true. Mirrors the shape of the
// Supabase schema closely enough that services can share nearly all of
// their business logic between mock and real-DB code paths. Seed data is
// conceptually aligned with supabase/seed.sql.
// ---------------------------------------------------------------------------

interface MockAuthUser {
  id: string;
  role: UserRole;
  email: string;
}

interface Store {
  categories: Category[];
  products: Product[];
  productImages: ProductImage[];
  orders: Order[];
  orderItems: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  notes: OrderNote[];
  settings: Map<string, unknown>;
  authTokens: Map<string, MockAuthUser>;
}

function now(): string {
  return new Date().toISOString();
}

function seedCategories(): Category[] {
  const defs: Array<[string, string, string, string]> = [
    ['a1000000-0000-4000-8000-000000000001', 'Flowers', 'flowers', 'Seasonal bouquets and arranged blooms.'],
    ['a1000000-0000-4000-8000-000000000002', 'Gift Boxes', 'gift-boxes', 'Curated boxes ready to give.'],
    [
      'a1000000-0000-4000-8000-000000000003',
      'Chocolates & Sweets',
      'chocolates-sweets',
      'Artisan chocolates and confections.',
    ],
    ['a1000000-0000-4000-8000-000000000004', 'Birthday', 'birthday', 'Gifts chosen for birthdays.'],
    ['a1000000-0000-4000-8000-000000000005', 'Anniversary', 'anniversary', 'Quietly elegant anniversary selections.'],
    ['a1000000-0000-4000-8000-000000000006', 'Graduation', 'graduation', 'Congratulations-worthy gifts.'],
    [
      'a1000000-0000-4000-8000-000000000007',
      'Personalized',
      'personalized',
      'Items we can arrange with a personal touch.',
    ],
  ];
  const ts = now();
  return defs.map(([id, name, slug, description], idx) => ({
    id,
    name,
    slug,
    description,
    image_path: `demo/categories/${slug}.jpg`,
    sort_order: idx + 1,
    is_active: true,
    created_at: ts,
    updated_at: ts,
  }));
}

function seedProducts(): Product[] {
  // id, categoryId, name, slug, description, price, stock, isAvailable, isFeatured
  const defs: Array<[string, string, string, string, string, number, number, boolean, boolean]> = [
    [
      'b1000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000001',
      'Garden Rose Bouquet',
      'garden-rose-bouquet',
      'A generous hand-tied bouquet of garden roses in soft blush and ivory, finished with linen ribbon.',
      2800,
      15,
      true,
      true,
    ],
    [
      'b1000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000001',
      'Wild Meadow Arrangement',
      'wild-meadow-arrangement',
      'Seasonal wildflowers loosely arranged in a ceramic vessel — airy, informal, and bright.',
      2200,
      20,
      true,
      true,
    ],
    [
      'b1000000-0000-4000-8000-000000000003',
      'a1000000-0000-4000-8000-000000000002',
      'Evening Indulgence Box',
      'evening-indulgence-box',
      'Dark chocolate, honeycomb, and a small candle nestled in kraft and tissue.',
      3200,
      15,
      true,
      true,
    ],
    [
      'b1000000-0000-4000-8000-000000000004',
      'a1000000-0000-4000-8000-000000000002',
      'Morning Ritual Set',
      'morning-ritual-set',
      'Loose-leaf tea, honey spoon, and a linen napkin — a gentle start.',
      1800,
      12,
      true,
      false,
    ],
    [
      'b1000000-0000-4000-8000-000000000005',
      'a1000000-0000-4000-8000-000000000003',
      'Single Origin Truffles',
      'single-origin-truffles',
      'Twelve hand-rolled truffles from a single cacao origin, boxed for gifting.',
      1500,
      20,
      true,
      true,
    ],
    [
      'b1000000-0000-4000-8000-000000000006',
      'a1000000-0000-4000-8000-000000000003',
      'Caramel Sea Salt Collection',
      'caramel-sea-salt-collection',
      'Soft caramels finished with flaky sea salt in a slim gift tin.',
      1200,
      12,
      true,
      false,
    ],
    [
      'b1000000-0000-4000-8000-000000000007',
      'a1000000-0000-4000-8000-000000000004',
      'Birthday Bloom & Treat',
      'birthday-bloom-and-treat',
      'A cheerful mixed bouquet paired with a small cake-slice chocolate bar.',
      2600,
      20,
      true,
      true,
    ],
    [
      'b1000000-0000-4000-8000-000000000008',
      'a1000000-0000-4000-8000-000000000005',
      'Anniversary Keepsake Duo',
      'anniversary-keepsake-duo',
      'Two stem roses with a bottle of sparkling non-alcoholic aperitif and a handwritten card option.',
      3800,
      15,
      true,
      true,
    ],
    [
      'b1000000-0000-4000-8000-000000000009',
      'a1000000-0000-4000-8000-000000000006',
      'Graduate Desk Set',
      'graduate-desk-set',
      'A leather notebook, pen, and congratulatory card arranged in a presentation box.',
      2400,
      12,
      true,
      false,
    ],
    [
      'b1000000-0000-4000-8000-000000000010',
      'a1000000-0000-4000-8000-000000000007',
      'Monogram Candle & Match Set',
      'monogram-candle-match-set',
      'Soy candle with optional monogram on the lid card, plus a brass match striker.',
      1600,
      12,
      true,
      false,
    ],
    [
      'b1000000-0000-4000-8000-000000000011',
      'a1000000-0000-4000-8000-000000000004',
      'Celebration Balloon Cluster',
      'celebration-balloon-cluster',
      'A refined cluster of matte balloons with a weight — available while stock lasts.',
      900,
      0,
      false,
      false,
    ],
    [
      'b1000000-0000-4000-8000-000000000012',
      'a1000000-0000-4000-8000-000000000002',
      'Hostess Welcome Tray',
      'hostess-welcome-tray',
      'Crackers, olives, and a small cheese knife on a reusable wooden board.',
      2700,
      3,
      true,
      false,
    ],
  ];
  const ts = now();
  return defs.map(([id, categoryId, name, slug, description, price, stock, isAvailable, isFeatured]) => ({
    id,
    category_id: categoryId,
    name,
    slug,
    description,
    price,
    stock_quantity: stock,
    is_available: isAvailable,
    is_featured: isFeatured,
    archived_at: null,
    created_at: ts,
    updated_at: ts,
  }));
}

function seedProductImages(): ProductImage[] {
  const slugs: Record<string, string> = {
    'b1000000-0000-4000-8000-000000000001': 'garden-rose-bouquet',
    'b1000000-0000-4000-8000-000000000002': 'wild-meadow',
    'b1000000-0000-4000-8000-000000000003': 'evening-indulgence',
    'b1000000-0000-4000-8000-000000000004': 'morning-ritual',
    'b1000000-0000-4000-8000-000000000005': 'truffles',
    'b1000000-0000-4000-8000-000000000006': 'caramels',
    'b1000000-0000-4000-8000-000000000007': 'birthday-bloom',
    'b1000000-0000-4000-8000-000000000008': 'anniversary-duo',
    'b1000000-0000-4000-8000-000000000009': 'graduate-desk',
    'b1000000-0000-4000-8000-000000000010': 'monogram-candle',
    'b1000000-0000-4000-8000-000000000011': 'balloons',
    'b1000000-0000-4000-8000-000000000012': 'hostess-tray',
  };
  const ts = now();
  return Object.entries(slugs).map(([productId, slug]) => ({
    id: randomUUID(),
    product_id: productId,
    storage_path: `demo/products/${slug}.jpg`,
    url: `https://picsum.photos/seed/${slug}/640/480`,
    alt_text: null,
    sort_order: 0,
    created_at: ts,
  }));
}

function seedSettings(): Map<string, unknown> {
  return new Map<string, unknown>([
    ['business_name', 'BanaGifts'],
    ['tagline', 'Gifts across Ethiopia — confirmed by phone'],
    ['contact_phone', '+251911000000'],
    ['contact_email', 'hello@banagifts.et'],
    ['currency', 'ETB'],
    ['default_delivery_fee', 200],
    ['free_delivery_threshold', null],
    [
      'delivery_areas',
      [
        'Addis Ababa',
        'Bole',
        'Piassa',
        'CMC',
        'Kazanchis',
        'Saris',
        'Lebu',
        'Ayat',
        'Adama',
        'Bahir Dar',
        'Hawassa',
        'Dire Dawa',
        'Mekelle',
        'Jimma',
        'Gondar',
      ],
    ],
    ['min_lead_time_days', 1],
    [
      'announcement',
      'Order online, then call us to confirm. Prices in Ethiopian Birr (ETB). Delivery to any location we can arrange.',
    ],
    [
      'privacy_notice',
      'We use your phone number only to confirm and deliver your gift order. We do not sell personal information.',
    ],
    [
      'policy_text',
      'After you submit an order, call the shop to confirm the gift, delivery place, price in ETB, and payment. Nothing is charged on this website.',
    ],
  ]);
}

function seedAuthTokens(): Map<string, MockAuthUser> {
  return new Map<string, MockAuthUser>([
    ['mock-admin-token', { id: '00000000-0000-4000-8000-000000000001', role: 'admin', email: 'admin@example.com' }],
    [
      'mock-customer-token',
      { id: '00000000-0000-4000-8000-000000000002', role: 'customer', email: 'customer@example.com' },
    ],
  ]);
}

function buildStore(): Store {
  return {
    categories: seedCategories(),
    products: seedProducts(),
    productImages: seedProductImages(),
    orders: [],
    orderItems: [],
    statusHistory: [],
    notes: [],
    settings: seedSettings(),
    authTokens: seedAuthTokens(),
  };
}

let store: Store = buildStore();

/** Test-only / startup helper: wipes and reseeds the in-memory store. */
export function resetMockDb(): void {
  store = buildStore();
}

export function getMockAuthUser(token: string): MockAuthUser | undefined {
  return store.authTokens.get(token);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const mockCategories = {
  list(activeOnly: boolean): Category[] {
    const items = activeOnly ? store.categories.filter((c) => c.is_active) : store.categories;
    return [...items].sort((a, b) => a.sort_order - b.sort_order);
  },
  findBySlug(slug: string): Category | undefined {
    return store.categories.find((c) => c.slug === slug);
  },
  findById(id: string): Category | undefined {
    return store.categories.find((c) => c.id === id);
  },
  slugExists(slug: string, excludeId?: string): boolean {
    return store.categories.some((c) => c.slug === slug && c.id !== excludeId);
  },
  create(input: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Category {
    const ts = now();
    const category: Category = { id: randomUUID(), created_at: ts, updated_at: ts, ...input };
    store.categories.push(category);
    return category;
  },
  update(id: string, patch: Partial<Omit<Category, 'id' | 'created_at'>>): Category | undefined {
    const category = store.categories.find((c) => c.id === id);
    if (!category) return undefined;
    Object.assign(category, patch, { updated_at: now() });
    return category;
  },
  delete(id: string): boolean {
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    store.categories.splice(idx, 1);
    for (const product of store.products) {
      if (product.category_id === id) product.category_id = null;
    }
    return true;
  },
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  featured?: boolean;
  includeArchived?: boolean;
  includeUnavailable?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page: number;
  limit: number;
}

export const mockProducts = {
  list(filters: ProductFilters): { items: Product[]; total: number } {
    let items = [...store.products];

    if (!filters.includeArchived) items = items.filter((p) => p.archived_at === null);
    if (!filters.includeUnavailable) items = items.filter((p) => p.is_available);
    if (filters.featured !== undefined) items = items.filter((p) => p.is_featured === filters.featured);
    if (filters.categorySlug) {
      const category = store.categories.find((c) => c.slug === filters.categorySlug);
      items = category ? items.filter((p) => p.category_id === category.id) : [];
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }

    switch (filters.sort) {
      case 'price_asc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    const total = items.length;
    const start = (filters.page - 1) * filters.limit;
    const page = items.slice(start, start + filters.limit);
    return { items: page, total };
  },
  findBySlug(slug: string): Product | undefined {
    return store.products.find((p) => p.slug === slug);
  },
  findById(id: string): Product | undefined {
    return store.products.find((p) => p.id === id);
  },
  findByIds(ids: string[]): Product[] {
    const set = new Set(ids);
    return store.products.filter((p) => set.has(p.id));
  },
  slugExists(slug: string, excludeId?: string): boolean {
    return store.products.some((p) => p.slug === slug && p.id !== excludeId);
  },
  create(input: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'archived_at'>): Product {
    const ts = now();
    const product: Product = {
      id: randomUUID(),
      created_at: ts,
      updated_at: ts,
      archived_at: null,
      ...input,
      stock_quantity: Math.max(0, Math.floor(input.stock_quantity ?? 0)),
    };
    store.products.push(product);
    return product;
  },
  update(id: string, patch: Partial<Omit<Product, 'id' | 'created_at'>>): Product | undefined {
    const product = store.products.find((p) => p.id === id);
    if (!product) return undefined;
    Object.assign(product, patch, { updated_at: now() });
    if (typeof patch.stock_quantity === 'number' && patch.stock_quantity <= 0) {
      product.stock_quantity = 0;
      product.is_available = false;
    }
    return product;
  },
  archive(id: string): Product | undefined {
    return mockProducts.update(id, { archived_at: now(), is_available: false });
  },
  /** Atomically reserve stock for an order line. Returns false if insufficient. */
  decrementStock(id: string, quantity: number): boolean {
    const product = store.products.find((p) => p.id === id);
    if (!product || product.archived_at !== null || quantity < 1) return false;
    if (product.stock_quantity < quantity) return false;
    product.stock_quantity -= quantity;
    if (product.stock_quantity <= 0) {
      product.stock_quantity = 0;
      product.is_available = false;
    }
    product.updated_at = now();
    return true;
  },
  /** Restore stock when an order is cancelled. Re-opens availability if stock was empty. */
  restoreStock(id: string, quantity: number): void {
    const product = store.products.find((p) => p.id === id);
    if (!product || quantity < 1) return;
    const wasEmpty = product.stock_quantity <= 0;
    product.stock_quantity += quantity;
    if (wasEmpty && product.archived_at === null && product.stock_quantity > 0) {
      product.is_available = true;
    }
    product.updated_at = now();
  },
};

export const mockProductImages = {
  listForProduct(productId: string): ProductImage[] {
    return store.productImages
      .filter((img) => img.product_id === productId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  listForProducts(productIds: string[]): ProductImage[] {
    const set = new Set(productIds);
    return store.productImages.filter((img) => set.has(img.product_id));
  },
  add(input: Omit<ProductImage, 'id' | 'created_at'>): ProductImage {
    const image: ProductImage = { id: randomUUID(), created_at: now(), ...input };
    store.productImages.push(image);
    return image;
  },
  delete(id: string): boolean {
    const idx = store.productImages.findIndex((img) => img.id === id);
    if (idx === -1) return false;
    store.productImages.splice(idx, 1);
    return true;
  },
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const mockSettings = {
  getAll(): BusinessSettingsMap {
    return Object.fromEntries(store.settings.entries());
  },
  get(key: string): unknown {
    return store.settings.get(key);
  },
  set(key: string, value: unknown): void {
    store.settings.set(key, value);
  },
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderFilters {
  search?: string;
  status?: Order['order_status'];
  paymentStatus?: Order['payment_status'];
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export const mockOrders = {
  referenceExists(reference: string): boolean {
    return store.orders.some((o) => o.order_reference === reference);
  },
  create(order: Order, items: OrderItem[], historyEntry: OrderStatusHistoryEntry): Order {
    store.orders.push(order);
    store.orderItems.push(...items);
    store.statusHistory.push(historyEntry);
    return order;
  },
  findById(id: string): Order | undefined {
    return store.orders.find((o) => o.id === id);
  },
  findByTrackingHash(hash: string): Order | undefined {
    return store.orders.find((o) => o.tracking_token_hash === hash);
  },
  itemsForOrder(orderId: string): OrderItem[] {
    return store.orderItems.filter((i) => i.order_id === orderId);
  },
  historyForOrder(orderId: string): OrderStatusHistoryEntry[] {
    return store.statusHistory
      .filter((h) => h.order_id === orderId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
  notesForOrder(orderId: string): OrderNote[] {
    return store.notes
      .filter((n) => n.order_id === orderId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  list(filters: OrderFilters): { items: Order[]; total: number } {
    let items = [...store.orders];

    if (filters.status) items = items.filter((o) => o.order_status === filters.status);
    if (filters.paymentStatus) items = items.filter((o) => o.payment_status === filters.paymentStatus);
    if (filters.dateFrom) items = items.filter((o) => o.delivery_date >= filters.dateFrom!);
    if (filters.dateTo) items = items.filter((o) => o.delivery_date <= filters.dateTo!);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (o) =>
          o.order_reference.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.recipient_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q),
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const start = (filters.page - 1) * filters.limit;
    const page = items.slice(start, start + filters.limit);
    return { items: page, total };
  },
  listAll(): Order[] {
    return [...store.orders];
  },
  update(id: string, patch: Partial<Order>): Order | undefined {
    const order = store.orders.find((o) => o.id === id);
    if (!order) return undefined;
    Object.assign(order, patch, { updated_at: now() });
    return order;
  },
  appendHistory(entry: OrderStatusHistoryEntry): void {
    store.statusHistory.push(entry);
  },
  addNote(note: OrderNote): void {
    store.notes.push(note);
  },
};
