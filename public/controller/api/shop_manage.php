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

$action = $_GET['action'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        if (isset($body['action'])) $action = $body['action'];
    } else {
        $action = $_POST['action'] ?? $action;
    }
}

if ($action === 'get_image') {
    $store = (int)($_GET['store'] ?? 0);
    $file = basename($_GET['file'] ?? '');
    if (!$file) exit();
    $path = __DIR__ . "/../../../storage/uploads/shop/$store/$file";
    if (file_exists($path)) {
        header('Content-Type: image/png');
        header('Cache-Control: public, max-age=86400');
        readfile($path);
        exit;
    }
    http_response_code(404); exit;
}

if ($action === 'get_store_image') {
    $store = (int)($_GET['store'] ?? 0);
    $path = __DIR__ . "/../../../storage/uploads/store/$store.png";
    if (file_exists($path)) {
        header('Content-Type: image/png');
        header('Cache-Control: public, max-age=86400');
        readfile($path);
        exit;
    }
    http_response_code(404); exit;
}

if ($action === 'get_cat_image') {
    $file = basename($_GET['file'] ?? '');
    if (!$file) exit();
    $path = __DIR__ . "/../../../storage/uploads/category/$file";
    if (file_exists($path)) {
        header('Content-Type: image/png');
        header('Cache-Control: public, max-age=86400');
        readfile($path);
        exit;
    }
    http_response_code(404); exit;
}

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;
if (!$user_id || !$session_id) out(['status' => 'error', 'message' => 'Unauthorized'], 401);

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);
if ($sessionManager->validateSessionStatus($user_id, $session_id) === 'invalid_session') out(['status' => 'error', 'message' => 'Unauthorized'], 401);
$user_id = (int)$user_id;

// Check if user is an owner or manager
$chk = $conn->prepare("SELECT store_id, role, s.name, s.campus, s.is_open FROM shop_store_owners o JOIN shop_stores s ON s.id = o.store_id WHERE o.user_id = ? LIMIT 1");
$chk->execute([$user_id]);
$storeRole = $chk->fetch(PDO::FETCH_ASSOC);

if (!$storeRole) out(['status' => 'error', 'message' => 'Not a store owner'], 403);
$storeId = (int)$storeRole['store_id'];
$storeName = $storeRole['name'];
$storeCampus = explode(',', $storeRole['campus']);

$body = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
    }
}

try {
    switch ($action) {
        case 'me':
            $counts = $conn->prepare("SELECT status, COUNT(*) as c FROM shop_orders WHERE store_id = ? GROUP BY status");
            $counts->execute([$storeId]);
            $stats = ['placed' => 0, 'active' => 0, 'deliver' => 0];
            foreach ($counts->fetchAll(PDO::FETCH_ASSOC) as $row) {
                if ($row['status'] === 'placed') $stats['placed'] += $row['c'];
                if ($row['status'] === 'accepted' || $row['status'] === 'packed') $stats['active'] += $row['c'];
                if ($row['status'] === 'out_for_delivery') $stats['deliver'] += $row['c'];
            }
            out(['status' => 'success', 'data' => ['store_id' => $storeId, 'name' => $storeName, 'role' => $storeRole['role'], 'campus' => $storeCampus, 'is_open' => (bool)$storeRole['is_open'], 'stats' => $stats]]);
            
        case 'store_settings_get':
            ensureDeliveryColumn($conn);
            $stmt = $conn->prepare("SELECT is_open, campus, delivery_settings FROM shop_stores WHERE id = ?");
            $stmt->execute([$storeId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            $settings['campus'] = explode(',', $settings['campus'] ?? '');
            $settings['delivery'] = parseDeliverySettings($settings['delivery_settings']);
            unset($settings['delivery_settings']);
            out(['status' => 'success', 'data' => $settings]);

        case 'store_settings_save':
            if ($storeRole['role'] !== 'owner') out(['status' => 'error', 'message' => 'Only owners can modify settings'], 403);
            ensureDeliveryColumn($conn);
            $is_open = (int)!empty($body['is_open']);
            $campus = implode(',', $body['campus'] ?? []);
            $delivery = json_encode(parseDeliverySettings($body['delivery'] ?? []));
            
            $conn->prepare("UPDATE shop_stores SET is_open = ?, campus = ?, delivery_settings = ? WHERE id = ?")->execute([
                $is_open, $campus, $delivery, $storeId
            ]);
            out(['status' => 'success']);
            
        case 'products':
            $q = trim($_GET['q'] ?? '');
            $sql = "SELECT p.*, GROUP_CONCAT(c.category_id) as cats FROM shop_products p LEFT JOIN shop_product_categories c ON c.product_id = p.id WHERE p.store_id = ?";
            $params = [$storeId];
            if ($q) {
                $sql .= " AND (p.title LIKE ? OR p.sku LIKE ?)";
                $params[] = "%$q%"; $params[] = "%$q%";
            }
            $sql .= " GROUP BY p.id ORDER BY p.updated_at DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($products as &$p) {
                $p['info'] = json_decode($p['info'] ?? '[]', true);
                $p['gallery'] = json_decode($p['gallery'] ?? '[]', true);
                $p['available_to'] = explode(',', $p['available_to']);
                $p['categories'] = array_filter(explode(',', $p['cats'] ?? ''));
                $p['is_active'] = (bool)$p['is_active'];
                unset($p['cats']);
            }
            out(['status' => 'success', 'data' => $products]);

        case 'upload_image':
            if (!isset($_FILES['file'])) out(['status' => 'error', 'message' => 'No file uploaded'], 400);
            $f = $_FILES['file'];
            if ($f['error'] !== UPLOAD_ERR_OK) out(['status' => 'error', 'message' => 'Upload error'], 400);
            if ($f['size'] > 2 * 1024 * 1024) out(['status' => 'error', 'message' => 'File too large (max 2MB)'], 400);
            
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $f['tmp_name']);
            finfo_close($finfo);
            if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'])) out(['status' => 'error', 'message' => 'Only JPG, PNG, WEBP allowed'], 400);
            
            $dir = __DIR__ . "/../../../storage/uploads/shop/$storeId";
            if (!is_dir($dir)) mkdir($dir, 0775, true);
            $filename = uniqid('img_') . '.png';
            $path = "$dir/$filename";
            
            // Convert to PNG as requested
            if (function_exists('imagecreatefromstring')) {
                $im = @imagecreatefromstring(file_get_contents($f['tmp_name']));
                if ($im) {
                    imagepng($im, $path);
                    imagedestroy($im);
                } else {
                    move_uploaded_file($f['tmp_name'], $path);
                }
            } else {
                move_uploaded_file($f['tmp_name'], $path);
            }
            
            out(['status' => 'success', 'url' => "/api/shop_manage?action=get_image&store=$storeId&file=$filename"]);


        case 'delete_image':
            $url = $body['url'] ?? '';
            if (preg_match('#^/api/shop_manage\?action=get_image&store=(\d+)&file=(.+)$#', $url, $m)) {
                if ((int)$m[1] === $storeId) {
                    $file = basename($m[2]);
                    $path = __DIR__ . "/../../../storage/uploads/shop/$storeId/$file";
                    if (file_exists($path)) @unlink($path);
                    out(['status' => 'success']);
                }
            }
            out(['status' => 'error', 'message' => 'Invalid image url'], 400);

        case 'product_save':
            $id = (int)($body['id'] ?? 0);
            $title = trim($body['title'] ?? '');
            $desc = trim($body['description'] ?? '');
            $price = (float)($body['price'] ?? 0);
            $discount = isset($body['discounted_price']) && $body['discounted_price'] !== '' ? (float)$body['discounted_price'] : null;
            $qty = (int)($body['quantity'] ?? 0);
            $unit = trim($body['unit'] ?? '');
            $campus = $body['available_to'] ?? [];
            $info = $body['info'] ?? [];
            $featured = $body['featured_image'] ?? '';
            $gallery = $body['gallery'] ?? [];
            $cats = array_map('intval', $body['categories'] ?? []);
            $active = (int)!empty($body['is_active']);
            
            if (!$title || $price <= 0) out(['status' => 'error', 'message' => 'Title and valid price required'], 422);
            if ($discount !== null && $discount > $price) out(['status' => 'error', 'message' => 'Discount price cannot be > original price'], 422);
            if ($discount !== null && $discount < 0) out(['status' => 'error', 'message' => 'Discount price cannot be negative'], 422);
            if ($qty < 0) out(['status' => 'error', 'message' => 'Quantity cannot be negative'], 422);
            $campus = array_values(array_intersect((array)$campus, ['UNI1','UNI2','OLD_CAMPUS','NEW_CAMPUS']));
            if (!is_array($gallery) || count($gallery) > 10) out(['status' => 'error', 'message' => 'Gallery can have at most 10 images'], 422);
            if (!$campus) out(['status' => 'error', 'message' => 'Select at least one campus'], 422);
            if (!$featured) out(['status' => 'error', 'message' => 'Featured image required'], 422);
            
            $conn->beginTransaction();
            
            if ($id > 0) {
                // Update
                $chk = $conn->prepare("SELECT id FROM shop_products WHERE store_id = ? AND id = ?");
                $chk->execute([$storeId, $id]);
                if (!$chk->fetchColumn()) out(['status' => 'error', 'message' => 'Product not found'], 404);
                
                $up = $conn->prepare("UPDATE shop_products SET title=?, description=?, price=?, discounted_price=?, quantity=?, unit=?, available_to=?, info=?, featured_image=?, gallery=?, is_active=? WHERE id=?");
                $up->execute([$title, $desc, $price, $discount, $qty, $unit, implode(',', $campus), json_encode($info), $featured, json_encode(array_slice($gallery, 0, 9)), $active, $id]);
            } else {
                // Insert
                $sku = strtoupper(uniqid("PRD{$storeId}-")); // Auto-generate SKU
                try {
                    $ins = $conn->prepare("INSERT INTO shop_products (sku, store_id, title, description, price, discounted_price, quantity, unit, available_to, info, featured_image, gallery, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
                    $ins->execute([$sku, $storeId, $title, $desc, $price, $discount, $qty, $unit, implode(',', $campus), json_encode($info), $featured, json_encode(array_slice($gallery, 0, 9)), $active]);
                    $id = (int)$conn->lastInsertId();
                } catch (PDOException $e) {
                    if ($e->getCode() == 23000) { // Duplicate entry
                        $conn->rollBack();
                        out(['status' => 'error', 'message' => 'SKU already exists'], 409);
                    }
                    throw $e;
                }
            }
            
            $conn->prepare("DELETE FROM shop_product_categories WHERE product_id = ?")->execute([$id]);
            if ($cats) {
                $insC = $conn->prepare("INSERT INTO shop_product_categories (product_id, category_id) VALUES (?,?)");
                foreach (array_unique($cats) as $cid) {
                    try { $insC->execute([$id, $cid]); } catch (PDOException $e) {}
                }
            }
            
            $conn->commit();
            out(['status' => 'success', 'data' => ['id' => $id]]);
            
        case 'orders':
            $stmt = $conn->prepare("SELECT * FROM shop_orders WHERE store_id = ? ORDER BY placed_at DESC");
            $stmt->execute([$storeId]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $orderIds = array_column($orders, 'id');
            $items = [];
            if (!empty($orderIds)) {
                $in = implode(',', array_fill(0, count($orderIds), '?'));
                $itemStmt = $conn->prepare("SELECT order_id, sku, title, price, quantity, image FROM shop_order_items WHERE order_id IN ($in)");
                $itemStmt->execute($orderIds);
                foreach ($itemStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                    $items[$row['order_id']][] = $row;
                }
            }
            
            foreach ($orders as &$o) {
                $o['items'] = $items[$o['id']] ?? [];
            }
            out(['status' => 'success', 'data' => $orders]);

        case 'update_order_status':
            $orderId = trim($body['order_id'] ?? '');
            $status = trim($body['status'] ?? '');
            $reason = trim($body['cancel_reason'] ?? '');
            $dontReaddStock = !empty($body['dont_readd_stock']);
            
            $valid = ['accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];
            if (!in_array($status, $valid)) out(['status' => 'error', 'message' => 'Invalid status'], 400);
            
            $conn->beginTransaction();
            $stmt = $conn->prepare("SELECT status FROM shop_orders WHERE id = ? AND store_id = ? FOR UPDATE");
            $stmt->execute([$orderId, $storeId]);
            $currentStatus = $stmt->fetchColumn();
            
            if (!$currentStatus) {
                $conn->rollBack();
                out(['status' => 'error', 'message' => 'Order not found'], 404);
            }
            if (in_array($currentStatus, ['delivered', 'cancelled', 'rejected'], true)) {
                $conn->rollBack();
                out(['status' => 'error', 'message' => 'Order is already ' . $currentStatus . ' and cannot be changed'], 400);
            }
            
            $up = $conn->prepare("UPDATE shop_orders SET status = ?, cancel_reason = ? WHERE id = ?");
            $up->execute([$status, in_array($status, ['cancelled', 'rejected']) ? $reason : null, $orderId]);
            
            if ($up->rowCount() > 0) {
                if (!in_array($currentStatus, ['cancelled', 'rejected']) && in_array($status, ['cancelled', 'rejected'])) {
                    if (!$dontReaddStock) {
                        $items = $conn->prepare("SELECT sku, quantity FROM shop_order_items WHERE order_id = ?");
                        $items->execute([$orderId]);
                        $updStock = $conn->prepare("UPDATE shop_products SET quantity = quantity + ? WHERE sku = ? AND store_id = ?");
                        foreach ($items->fetchAll(PDO::FETCH_ASSOC) as $item) {
                            $updStock->execute([$item['quantity'], $item['sku'], $storeId]);
                        }
                    }
                }
                $conn->commit();
                out(['status' => 'success']);
            }
            $conn->rollBack();
            out(['status' => 'error', 'message' => 'No change'], 400);
            
    }
    out(['status' => 'error', 'message' => 'Unknown action'], 400);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    out(['status' => 'error', 'message' => 'Server error', 'debug' => $e->getMessage()], 500);
}
