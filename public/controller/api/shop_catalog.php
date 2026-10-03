<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/shop_schema.php';

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Categories
    $cats = $conn->query("SELECT * FROM shop_categories WHERE is_active = 1 ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
    
    // Stores
    ensureDeliveryColumn($conn);
    $stores = $conn->query("SELECT id, name, description, campus, is_open, is_active, delivery_settings FROM shop_stores WHERE is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($stores as &$s) {
        $s['delivery'] = parseDeliverySettings($s['delivery_settings']);
        unset($s['delivery_settings']);
        $s['campus'] = explode(',', $s['campus'] ?? '');
        $s['logo'] = "/api/shop_manage?action=get_store_image&store={$s['id']}";
        $s['banner'] = $s['logo'];
        $s['categories'] = array_map('intval', $conn->query("SELECT category_id FROM shop_store_categories WHERE store_id = {$s['id']}")->fetchAll(PDO::FETCH_COLUMN));
        $s['featured'] = []; // TODO
        $s['is_open'] = (bool)$s['is_open'];
        $s['is_active'] = (bool)$s['is_active'];
    }
    
    // Products
    $prods = $conn->query("SELECT p.*, GROUP_CONCAT(c.category_id) as cats FROM shop_products p LEFT JOIN shop_product_categories c ON c.product_id = p.id WHERE p.is_active = 1 GROUP BY p.id")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($prods as &$p) {
        $p['info'] = json_decode($p['info'] ?? '[]', true);
        $p['gallery'] = json_decode($p['gallery'] ?? '[]', true);
        $p['available_to'] = explode(',', $p['available_to']);
        $p['categories'] = array_map('intval', array_filter(explode(',', $p['cats'] ?? '')));
        unset($p['cats']);
    }
    
    out(['status' => 'success', 'data' => ['categories' => $cats, 'stores' => $stores, 'products' => $prods]]);
} catch (Exception $e) {
    out(['status' => 'error', 'debug' => $e->getMessage()], 500);
}
