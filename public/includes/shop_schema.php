<?php
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
        opens_at TIME NULL, closes_at TIME NULL,
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
