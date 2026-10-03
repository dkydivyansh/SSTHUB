<?php
/** CLI / manual migration: php public/controller/api/migrate_shop.php */
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/shop_schema.php';

$db = new Database();
$conn = $db->getConnection();
try {
    ensureShopSchema($conn);
    echo "Shop tables created successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
