# SST Hub Shop (`/shop`) – Quick-Commerce Plan

A Zepto-style section inside SST Hub. Reuses the existing navbar (mobile + desktop), theme and auth. Campus-scoped delivery.

## 1. Scope & Phasing

| Phase | Work | Status |
|---|---|---|
| 1 | DB schema + migration (this doc) | planned |
| 2 | **Frontend only** (mock data, no backend calls) | next |
| 3 | PHP REST API (`public/controller/api/shop/*`) | later |
| 4 | Orders, payments, store dashboard, admin | later |

## 2. Database Design (MySQL, PDO – matches existing `migrate.php` style)

### 2.1 `shop_categories`
Categories shared by both products and stores.

| Column | Type | Notes |
|---|---|---|
| id | INT AI PK | |
| slug | VARCHAR(80) UNIQUE | url-friendly |
| name | VARCHAR(100) | |
| description | TEXT | |
| image | VARCHAR(255) | |
| parent_id | INT NULL FK self | suggestion: subcategories (Dairy > Milk) |
| sort_order | INT | |
| is_active | BOOL | |

### 2.2 `shop_stores`

| Column | Type | Notes |
|---|---|---|
| id | INT AI PK | |
| name | VARCHAR(120) | |
| description | TEXT | |
| logo / banner | VARCHAR(255) | suggestion |
| campus | SET('UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS') | where store serves |
| opens_at / closes_at | TIME | suggestion |
| is_open | BOOL | manual toggle |
| is_active | BOOL | |
| ~~owner_user_id~~ | – | replaced by `shop_store_owners` (multiple owners) |

`featured_products` – **do not store as a comma list of SKUs** (no FK integrity). Use a junction table:

### 2.2b `shop_store_owners` (multiple owners per store)
`store_id` FK → shop_stores, `user_id` INT FK → `users(id)` (matches `users.id INT AUTO_INCREMENT` in `database.sql`), `role` ENUM('owner','manager') DEFAULT 'owner', `created_at`. PK(store_id, user_id), INDEX(user_id) to answer "which stores can this user manage?".

### 2.3 `shop_store_featured` (frozen-key / FK-checked)
`store_id` FK, `product_id` FK, `sort_order`, PK(store_id, product_id). Product must belong to that store (enforced in API).

### 2.4 `shop_store_categories` (many-to-many)
`store_id` FK, `category_id` FK, PK(both).

### 2.5 `shop_products`

| Column | Type | Notes |
|---|---|---|
| id | INT AI PK | |
| sku | VARCHAR(64) UNIQUE | the key referenced by external systems |
| store_id | INT FK → shop_stores | |
| title | VARCHAR(200) | |
| description | TEXT | |
| price | DECIMAL(10,2) | MRP |
| discounted_price | DECIMAL(10,2) NULL | CHECK ≤ price |
| quantity | INT UNSIGNED | stock |
| unit | VARCHAR(30) | suggestion: "500 g", "1 L" |
| available_to | SET('UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS') | multi-select |
| info | JSON | `{"type":"organic","flavor":"mango"}` key-value |
| featured_image | VARCHAR(255) | |
| gallery | JSON | array, **max 10** (validated in API + `JSON_LENGTH(gallery) <= 10` CHECK) |
| is_active | BOOL | |
| created_at / updated_at | TIMESTAMP | |

## 2.9 Indexing Strategy
| Table | Index | Serves |
|---|---|---|
| shop_products | `(store_id, is_active)` | store page listing |
| shop_products | `(is_active, quantity)` | in-stock filter |
| shop_products | `(discounted_price)` | deals / sort by price |
| shop_products | FULLTEXT `(title, description)` | search |
| shop_products | `sku` UNIQUE | lookup by SKU |
| shop_product_categories | PK `(product_id, category_id)` + `INDEX (category_id, product_id)` | category page (reverse lookup) |
| shop_store_categories | PK + `INDEX (category_id, store_id)` | stores by category |
| shop_store_featured | PK + `INDEX (store_id, sort_order)` | ordered featured |
| shop_store_owners | PK + `INDEX (user_id)` | stores of a user |
| shop_stores | `(is_active, is_open)` | storefront list |
| shop_categories | `(parent_id, is_active, sort_order)`, slug UNIQUE | category rail/tree |
| shop_carts | UNIQUE `(user_id)` | one cart per user |
| shop_cart_items | UNIQUE `(cart_id, product_id)` | no duplicate lines |
| shop_orders | `(user_id, placed_at DESC)`, `(store_id, status, placed_at DESC)`, `order_no` UNIQUE | history, store queue |
| shop_order_items | `(order_id)`, `(product_id)` | order detail, sales stats |
| shop_order_events | `(order_id, created_at)` | timeline |

Notes: SET columns (`available_to`, `campus`) can't be indexed efficiently with `FIND_IN_SET`; for scale, optionally add `shop_product_campus(product_id, campus)` with `INDEX(campus, product_id)` and keep the SET for display. Avoid indexing JSON `info`; if filtering on a key is needed, add a generated column + index.

### 2.6 `shop_product_categories` (many-to-many)
`product_id` FK, `category_id` FK, PK(both).

### 2.7 Orders (designed now, built in Phase 4)

- `shop_carts` (user_id, campus) + `shop_cart_items` (cart_id, product_id, qty)
- `shop_addresses` (user_id, campus, hostel/building, room, phone, landmark)
- `shop_orders` (id, order_no, user_id, store_id, address snapshot JSON, subtotal, delivery_fee, total, payment_method[COD/UPI/WALLET], payment_status, status, placed_at)
- `shop_order_items` (order_id, product_id, sku, title, price – **snapshots**, qty)
- `shop_order_events` (order_id, status, note, created_at) – timeline
- Status flow: `placed → accepted → packed → out_for_delivery → delivered` | `cancelled` | `rejected`
- Orders are **per store**: a mixed cart is split into one order per store at checkout.

## 3. Suggestions
1. Junction tables instead of comma/JSON lists for categories & featured products (real FKs).
2. Stock decrement inside a transaction with `UPDATE ... WHERE quantity >= ?` to avoid overselling.
3. Snapshot product price/title in order items.
4. Campus selected once (header chip, like Zepto's location) and stored in localStorage/profile; products filtered by `FIND_IN_SET`.
5. Offer % computed, not stored.
6. Delivery fee/free-delivery threshold & store min-order in `shop_stores`.
7. Coupons table + banners table (later).
8. Images via existing `storage/uploads` handler.

## 4. Migration Script (Phase 1 deliverable)
File: `public/controller/api/migrate_shop.php` (same pattern as `migrate.php`: `Database` class, `$conn->exec()`, try/catch, `CREATE TABLE IF NOT EXISTS`, order: categories → stores → store_categories → products → product_categories → store_featured → orders tables).

```sql
CREATE TABLE IF NOT EXISTS shop_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  parent_id INT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_cat_tree (parent_id, is_active, sort_order),
  FOREIGN KEY (parent_id) REFERENCES shop_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shop_stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  logo VARCHAR(255), banner VARCHAR(255),
  campus SET('UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS') NOT NULL,
  opens_at TIME NULL, closes_at TIME NULL,
  is_open BOOLEAN DEFAULT TRUE, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_status (is_active, is_open)
);

CREATE TABLE IF NOT EXISTS shop_store_owners (
  store_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner','manager') DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id, user_id),
  INDEX idx_owner_user (user_id),
  FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shop_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  store_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  unit VARCHAR(30),
  available_to SET('UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS') NOT NULL,
  info JSON NULL,
  featured_image VARCHAR(255),
  gallery JSON NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_discount CHECK (discounted_price IS NULL OR discounted_price <= price),
  CONSTRAINT chk_gallery CHECK (gallery IS NULL OR JSON_LENGTH(gallery) <= 10),
  FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE,
  INDEX idx_store_active (store_id, is_active),
  INDEX idx_active_qty (is_active, quantity),
  INDEX idx_discount (discounted_price),
  FULLTEXT idx_search (title, description)
);

CREATE TABLE IF NOT EXISTS shop_product_categories (
  product_id INT NOT NULL, category_id INT NOT NULL,
  PRIMARY KEY (product_id, category_id),
  INDEX idx_cat_product (category_id, product_id),
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES shop_categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shop_store_categories (
  store_id INT NOT NULL, category_id INT NOT NULL,
  PRIMARY KEY (store_id, category_id),
  INDEX idx_cat_store (category_id, store_id),
  FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES shop_categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shop_store_featured (
  store_id INT NOT NULL, product_id INT NOT NULL, sort_order INT DEFAULT 0,
  PRIMARY KEY (store_id, product_id),
  INDEX idx_featured_order (store_id, sort_order),
  FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE
);
```
(Order tables SQL written in Phase 4.)

## 5. Frontend Plan (Phase 2, React + Tailwind v4)

### Routes (inside `src/App.tsx`, lazy-loaded)
| Route | Page |
|---|---|
| `/shop` | Home: campus chip, search, category rail, banners, featured stores, product sections |
| `/shop/category/:slug` | Category listing with filters/sort |
| `/shop/store/:id` | Store page: banner, featured products, categories |
| `/shop/product/:sku` | Product detail: gallery, info key-values, add to cart |
| `/shop/search?q=` | Search results |
| `/shop/cart` | Cart + bill summary |
| `/shop/checkout` | Address, payment, place order |
| `/shop/orders`, `/shop/orders/:id` | History + live status timeline |

### Structure
```
src/pages/shop/            ShopHome, CategoryPage, StorePage, ProductPage, CartPage, CheckoutPage, OrdersPage, OrderDetail
src/components/shop/       ShopLayout (reuses site Navbar/MobileNav), ProductCard, CategoryTile, StoreCard,
                           CartBar (sticky bottom "View cart"), QtyStepper, CampusPicker, ImageGallery, SearchBar
src/hooks/shop/            useCart (context + localStorage), useCampus
src/data/shop/             mock categories/stores/products (shape mirrors DB)
src/utils/shop/            types.ts, pricing.ts (discount %, totals)
```

### UX details (Zepto-like)
- Green/brand accent on existing theme; product cards with discount badge, unit, ADD → stepper.
- Sticky bottom cart bar (above mobile nav), cart drawer on desktop.
- Campus picker modal on first visit; items not available to chosen campus are hidden/greyed.
- Skeleton loaders, out-of-stock state, max qty = stock.
- Cart in React context + localStorage; API sync in Phase 3.

## 6. API Outline (Phase 3)
`GET /api/shop/categories`, `/stores?campus=`, `/stores/:id`, `/products?campus=&category=&store=&q=`, `/products/:sku`;
`POST /api/shop/cart/validate`, `/orders`; `GET /api/shop/orders`; admin/store CRUD routes with auth checks.

## 7. Open Questions
1. Payment: COD/UPI only, or an in-app wallet?
2. Who fulfils orders – store owners with a dashboard, or one admin?
3. Delivery: flat fee, free over threshold?
4. Single-store carts (Zepto-like) or multi-store carts split into orders?
