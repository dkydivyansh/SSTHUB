<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';
require_once __DIR__ . '/../../includes/shop_schema.php';

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

$user_id = (int)($_COOKIE['user_id'] ?? 0);
$session_id = $_COOKIE['session_id'] ?? null;
if (!$user_id || !$session_id) out(['status' => 'error', 'message' => 'Unauthorized'], 401);

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);
if ($sessionManager->validateSessionStatus($user_id, $session_id) === 'invalid_session') {
    out(['status' => 'error', 'message' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'my_orders') {
    $orders = $conn->prepare("SELECT * FROM shop_orders WHERE user_id = ? ORDER BY placed_at DESC");
    $orders->execute([$user_id]);
    $res = $orders->fetchAll(PDO::FETCH_ASSOC);

    foreach ($res as &$o) {
        $st = $conn->prepare("SELECT name FROM shop_stores WHERE id = ?");
        $st->execute([$o['store_id']]);
        $o['store_name'] = $st->fetchColumn() ?: 'Store';
        
        $items = $conn->prepare("SELECT sku, title, price, quantity as qty, image FROM shop_order_items WHERE order_id = ?");
        $items->execute([$o['id']]);
        $o['lines'] = $items->fetchAll(PDO::FETCH_ASSOC);
    }
    out(['status' => 'success', 'data' => $res]);
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) out(['status' => 'error', 'message' => 'Invalid JSON'], 400);

    $cart = $body['cart'] ?? [];
    if (!is_array($cart)) out(['status' => 'error', 'message' => 'Invalid cart'], 400);
    $address = trim($body['address'] ?? '');
    $mobile = trim($body['mobile'] ?? '');
    $note = trim($body['note'] ?? '');
    $payment_method = 'COD';
    $campus = $body['campus'] ?? '';
    if (!in_array($campus, ['UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS'], true)) out(['status' => 'error', 'message' => 'Select a valid campus'], 400);
    ensureDeliveryColumn($conn);

    if (empty($cart)) out(['status' => 'error', 'message' => 'Cart is empty'], 400);
    if (!$address || !$mobile) out(['status' => 'error', 'message' => 'Address and mobile are required'], 400);

    // Get product info and group by store
    $byStore = [];
    $productIds = [];
    $skus = array_keys($cart);
    
    if (empty($skus)) out(['status' => 'error', 'message' => 'Cart is empty'], 400);
    
    $in = implode(',', array_fill(0, count($skus), '?'));
    $stmt = $conn->prepare("SELECT p.id, p.sku, p.store_id, p.title, p.price, p.discounted_price, p.quantity, p.featured_image, p.available_to, s.campus AS store_campus, s.is_open, s.is_active as store_active, s.name as store_name FROM shop_products p JOIN shop_stores s ON p.store_id = s.id WHERE p.sku IN ($in) AND p.is_active = 1");
    $stmt->execute($skus);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $productMap = [];
    foreach ($products as $p) {
        $productMap[$p['sku']] = $p;
    }

    try {
        $conn->beginTransaction();
        
        foreach ($cart as $sku => $qty) {
            $qty = (int)$qty;
            if ($qty <= 0) continue;
            
            if (!isset($productMap[$sku])) {
                throw new Exception("Product $sku not found or inactive.");
            }
            $p = $productMap[$sku];
            if (!$p['is_open'] || !$p['store_active']) {
                throw new Exception("Store '" . $p['store_name'] . "' is currently closed.");
            }
            if (!in_array($campus, explode(',', (string)$p['available_to']), true) || !in_array($campus, explode(',', (string)$p['store_campus']), true)) {
                throw new Exception($p['title'] . " is not deliverable to the selected campus.");
            }
            
            if ((int)$p['quantity'] < $qty) {
                throw new Exception("Insufficient stock for " . $p['title'] . ". Available: " . $p['quantity']);
            }
            
            // Deduct stock
            $upd = $conn->prepare("UPDATE shop_products SET quantity = quantity - ? WHERE sku = ? AND quantity >= ?");
            $upd->execute([$qty, $sku, $qty]);
            if ($upd->rowCount() === 0) {
                throw new Exception("Could not deduct stock for " . $p['title']);
            }
            
            $storeId = (int)$p['store_id'];
            if (!isset($byStore[$storeId])) $byStore[$storeId] = [];
            
            $effPrice = (float)($p['discounted_price'] ?? $p['price']);
            $byStore[$storeId][] = [
                'product_id' => $p['id'],
                'sku' => $sku,
                'title' => $p['title'],
                'price' => $effPrice,
                'qty' => $qty,
                'image' => $p['featured_image']
            ];
        }
        
        if (empty($byStore)) throw new Exception('Cart is empty');

        $createdOrders = [];
        
        // Insert orders
        foreach ($byStore as $storeId => $items) {
            $subtotal = 0;
            foreach ($items as $it) {
                $subtotal += $it['price'] * $it['qty'];
            }
            $ds = $conn->prepare("SELECT delivery_settings FROM shop_stores WHERE id = ?");
            $ds->execute([$storeId]);
            $delivery_fee = calcDeliveryFee(parseDeliverySettings($ds->fetchColumn()), $campus, (float)$subtotal);
            $total = $subtotal + $delivery_fee;
            
            $orderId = 'SH' . strtoupper(base_convert((string)(int)(microtime(true) * 10000), 10, 36)) . $storeId . strtoupper(bin2hex(random_bytes(2)));
            
            $conn->prepare("INSERT INTO shop_orders (id, user_id, store_id, address, mobile, user_note, subtotal, delivery_fee, total, payment_method) VALUES (?,?,?,?,?,?,?,?,?,?)")
                ->execute([$orderId, $user_id, $storeId, $address, $mobile, $note, $subtotal, $delivery_fee, $total, $payment_method]);
                
            $insertItem = $conn->prepare("INSERT INTO shop_order_items (order_id, product_id, sku, title, price, quantity, image) VALUES (?,?,?,?,?,?,?)");
            foreach ($items as $it) {
                $insertItem->execute([$orderId, $it['product_id'], $it['sku'], $it['title'], $it['price'], $it['qty'], $it['image']]);
            }
            
            $createdOrders[] = $orderId;
            
            // Notify store owner
            $owner = $conn->prepare("SELECT mobile FROM shop_store_owners WHERE store_id = ? LIMIT 1");
            $owner->execute([$storeId]);
            $ownerMobile = $owner->fetchColumn();
            if ($ownerMobile) {
                require_once __DIR__ . '/../../includes/EvolutionAPI.php';
                EvolutionAPI::sendOrderMessage('new_order_owner', $ownerMobile, $orderId, $total);
            }
        }
        
        $conn->commit();
        out(['status' => 'success', 'orders' => $createdOrders]);
    } catch (Exception $e) {
        $conn->rollBack();
        out(['status' => 'error', 'message' => $e->getMessage()], 400);
    }
}

out(['status' => 'error', 'message' => 'Invalid endpoint'], 404);
