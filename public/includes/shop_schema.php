<?php
/** Adds shop_stores.delivery_settings (JSON text) if missing. */
function ensureDeliveryColumn(PDO $conn): void {
    $has = $conn->query("SHOW COLUMNS FROM shop_stores LIKE 'delivery_settings'")->fetch();
    if (!$has) $conn->exec("ALTER TABLE shop_stores ADD COLUMN delivery_settings TEXT NULL");
}

/** Normalise stored settings => ['UNI1'=>['fee'=>float,'free_above'=>float], ...] (0 = free / no threshold). */
function parseDeliverySettings($raw): array {
    $d = is_array($raw) ? $raw : (json_decode($raw ?? '', true) ?: []);
    $out = [];
    foreach (['UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS'] as $c) {
        $out[$c] = [
            'fee' => max(0, round((float)($d[$c]['fee'] ?? 0), 2)),
            'free_above' => max(0, round((float)($d[$c]['free_above'] ?? 0), 2)),
        ];
    }
    return $out;
}

function calcDeliveryFee(array $settings, string $campus, float $subtotal): float {
    $s = $settings[$campus] ?? ['fee' => 0, 'free_above' => 0];
    if ($s['fee'] <= 0) return 0.0;
    if ($s['free_above'] > 0 && $subtotal >= $s['free_above']) return 0.0;
    return (float)$s['fee'];
}

/**
 * Shop schema (MySQL). Idempotent: safe to call on every admin request.
 * Mirrors SHOP_PLAN.md §4, except logo/banner are MEDIUMTEXT so base64 data URIs fit.
 */
function ensureShopSchema(PDO $conn): void {
    $conn->exec("CREATE TABLE IF NOT EXISTS shop_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image MEDIUMTEXT,
        parent_id INT NULL,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_cat_tree (parent_id, is_active, sort_order),
        FOREIGN KEY (parent_id) REFERENCES shop_categories(id) ON DELETE SET NULL
    )");
    $conn->exec("CREATE TABLE IF NOT EXISTS shop_stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        description TEXT,
        logo MEDIUMTEXT, banner MEDIUMTEXT,
        campus SET('UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS') NOT NULL,
        is_open BOOLEAN DEFAULT TRUE, is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_store_status (is_active, is_open)
    )");
    $conn->exec("CREATE TABLE IF NOT EXISTS shop_store_owners (
        store_id INT NOT NULL,
        user_id INT NOT NULL,
        mobile VARCHAR(15) NULL,
        role ENUM('owner','manager') DEFAULT 'owner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (store_id, user_id),
        INDEX idx_owner_user (user_id),
        FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $conn->exec("CREATE TABLE IF NOT EXISTS shop_products (
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
        featured_image MEDIUMTEXT,
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
    )");
    $conn->exec("CREATE TABLE IF NOT EXISTS shop_product_categories (
        product_id INT NOT NULL, category_id INT NOT NULL,
        PRIMARY KEY (product_id, category_id),
        INDEX idx_cat_product (category_id, product_id),
        FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES shop_categories(id) ON DELETE CASCADE
    )");
    $conn->exec("CREATE TABLE IF NOT EXISTS shop_store_categories (
        store_id INT NOT NULL, category_id INT NOT NULL,
        PRIMARY KEY (store_id, category_id),
        INDEX idx_cat_store (category_id, store_id),
        FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES shop_categories(id) ON DELETE CASCADE
    )");
    $conn->exec("CREATE TABLE IF NOT EXISTS shop_store_featured (
        store_id INT NOT NULL, product_id INT NOT NULL, sort_order INT DEFAULT 0,
        PRIMARY KEY (store_id, product_id),
        INDEX idx_featured_order (store_id, sort_order),
        FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE
    )");

    $conn->exec("CREATE TABLE IF NOT EXISTS shop_orders (
        id VARCHAR(50) PRIMARY KEY,
        user_id INT NOT NULL,
        store_id INT NOT NULL,
        status ENUM('placed', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'rejected') DEFAULT 'placed',
        cancel_reason TEXT NULL,
        address TEXT NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        user_note TEXT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL DEFAULT 'COD',
        placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_user (user_id, placed_at DESC),
        INDEX idx_order_store (store_id, status, placed_at DESC),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES shop_stores(id) ON DELETE CASCADE
    )");

    $conn->exec("CREATE TABLE IF NOT EXISTS shop_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        product_id INT NULL,
        sku VARCHAR(64) NOT NULL,
        title VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT UNSIGNED NOT NULL,
        image MEDIUMTEXT,
        INDEX idx_item_order (order_id),
        FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE SET NULL
    )");

    // Seed the starter categories (ids match the ones offered on /shop-reg)
    if ((int)$conn->query("SELECT COUNT(*) FROM shop_categories")->fetchColumn() === 0) {
        $seed = [
            [1, 'fruits-veg', 'Fruits & Veggies', 'Fresh produce'],
            [2, 'dairy', 'Dairy & Eggs', 'Milk, curd, eggs'],
            [3, 'snacks', 'Snacks', 'Chips, namkeen, biscuits'],
            [4, 'beverages', 'Drinks', 'Cold drinks, juices, energy'],
            [5, 'instant', 'Instant Food', 'Noodles, pasta, ready meals'],
            [6, 'stationery', 'Stationery', 'Pens, notebooks, lab needs'],
            [7, 'personal-care', 'Personal Care', 'Hygiene & grooming'],
            [8, 'bakery', 'Bakery', 'Bread, buns, cakes'],
        ];
        $st = $conn->prepare("INSERT INTO shop_categories (id, slug, name, description, sort_order) VALUES (?,?,?,?,?)");
        foreach ($seed as $i => $r) $st->execute([$r[0], $r[1], $r[2], $r[3], $i]);
    }
}
