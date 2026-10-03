<?php
/**
 * Shop admin API (admin role only: userdata.type = 'admin').
 *
 *   GET  ?action=me                      -> {is_admin}
 *   GET  ?action=applications            -> all applications (no images)
 *   GET  ?action=application&id=         -> one application (owners resolved + categories)
 *   GET  ?action=thumb&id=               -> application thumbnail (image bytes)
 *   GET  ?action=categories              -> existing shop_categories
 *   GET  ?action=live                    -> live stores with product counts
 *   GET  ?action=store_image&id=         -> live store logo (image bytes)
 *   POST {action:'merge', id, campus[], map:{ "<custom name>": {mode:'map', category_id} | {mode:'new'} }}
 *   POST {action:'reject', id}
 */
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';
require_once __DIR__ . '/../../includes/shop_schema.php';

function out($data, $code = 200) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode($data);
    exit();
}
function sendDataUri(?string $uri) {
    if (!$uri || !preg_match('#^data:(image/[a-z+]+);base64,(.+)$#s', $uri, $m)) { http_response_code(404); exit(); }
    header('Content-Type: ' . $m[1]);
    header('Cache-Control: private, max-age=300');
    echo base64_decode($m[2]);
    exit();
}

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;
if (!$user_id || !$session_id) out(['status' => 'error', 'message' => 'Unauthorized: Missing session cookies'], 401);

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);
if ($sessionManager->validateSessionStatus($user_id, $session_id) === 'invalid_session') {
    out(['status' => 'error', 'message' => 'Unauthorized: Invalid session'], 401);
}
$user_id = (int)$user_id;

$chk = $conn->prepare("SELECT type FROM userdata WHERE user_id = ? AND status = 'active'");
$chk->execute([$user_id]);
$isAdmin = $chk->fetchColumn() === 'admin';
$action = $_GET['action'] ?? '';
$body = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $action = $body['action'] ?? $action;
}
if ($action === 'me') out(['status' => 'success', 'data' => ['is_admin' => $isAdmin]]);
if (!$isAdmin) out(['status' => 'error', 'message' => 'Forbidden: admin only'], 403);

try {
    ensureShopSchema($conn);

    if (!extension_loaded('pdo_sqlite')) out(['status' => 'error', 'message' => 'pdo_sqlite PHP extension is not enabled'], 500);
    $dir = __DIR__ . '/../../../storage';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $lite = new PDO('sqlite:' . $dir . '/shop_reg.sqlite');
    $lite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $lite->exec("CREATE TABLE IF NOT EXISTS shop_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT, applicant_id INTEGER NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL,
        thumbnail TEXT, owners TEXT NOT NULL, categories TEXT NOT NULL, custom_categories TEXT NOT NULL DEFAULT '[]', campus TEXT NOT NULL DEFAULT 'UNI1',
        status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    $cols = array_column($lite->query("PRAGMA table_info(shop_applications)")->fetchAll(PDO::FETCH_ASSOC), 'name');
    if (!in_array('custom_categories', $cols)) $lite->exec("ALTER TABLE shop_applications ADD COLUMN custom_categories TEXT NOT NULL DEFAULT '[]'");
    if (!in_array('campus', $cols)) $lite->exec("ALTER TABLE shop_applications ADD COLUMN campus TEXT NOT NULL DEFAULT 'UNI1'");
    if (!in_array('merged_store_id', $cols)) $lite->exec("ALTER TABLE shop_applications ADD COLUMN merged_store_id INTEGER");
    if (!in_array('reviewed_by', $cols)) $lite->exec("ALTER TABLE shop_applications ADD COLUMN reviewed_by INTEGER");
    if (!in_array('reviewed_at', $cols)) $lite->exec("ALTER TABLE shop_applications ADD COLUMN reviewed_at TEXT");

    $loadApp = function (int $id) use ($lite) {
        $s = $lite->prepare("SELECT * FROM shop_applications WHERE id = ?");
        $s->execute([$id]);
        return $s->fetch(PDO::FETCH_ASSOC) ?: null;
    };
    $userInfo = function (int $uid) use ($conn) {
        $s = $conn->prepare("SELECT u.id, u.email, ud.name, ud.rollno FROM users u LEFT JOIN userdata ud ON ud.user_id = u.id WHERE u.id = ?");
        $s->execute([$uid]);
        return $s->fetch(PDO::FETCH_ASSOC) ?: ['id' => $uid, 'email' => '(deleted user)', 'name' => '', 'rollno' => ''];
    };

    switch ($action) {
        case 'applications': {
            $rows = $lite->query("SELECT id, applicant_id, name, status, created_at, merged_store_id, custom_categories FROM shop_applications ORDER BY (status = 'pending') DESC, id DESC")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as &$r) {
                $a = $userInfo((int)$r['applicant_id']);
                $r['applicant'] = ['name' => $a['name'], 'email' => $a['email']];
                $r['custom_count'] = count(json_decode($r['custom_categories'], true) ?: []);
                unset($r['custom_categories']);
            }
            out(['status' => 'success', 'data' => $rows]);
        }

        case 'application': {
            $app = $loadApp((int)($_GET['id'] ?? 0));
            if (!$app) out(['status' => 'error', 'message' => 'Not found'], 404);
            $owners = [];
            foreach (json_decode($app['owners'], true) ?: [] as $o) {
                $owners[] = array_merge($userInfo((int)$o['id']), ['mobile' => $o['mobile'] ?? '']);
            }
            $ids = json_decode($app['categories'], true) ?: [];
            $cats = [];
            if ($ids) {
                $in = implode(',', array_fill(0, count($ids), '?'));
                $s = $conn->prepare("SELECT id, name FROM shop_categories WHERE id IN ($in)");
                $s->execute($ids);
                $cats = $s->fetchAll(PDO::FETCH_ASSOC);
            }
            out(['status' => 'success', 'data' => [
                'id' => (int)$app['id'], 'name' => $app['name'], 'description' => $app['description'],
                'status' => $app['status'], 'created_at' => $app['created_at'], 'merged_store_id' => $app['merged_store_id'],
                'owners' => $owners, 'categories' => $cats,
                'custom_categories' => json_decode($app['custom_categories'], true) ?: [],
                'campus' => array_filter(explode(',', $app['campus'] ?? '')),
            ]]);
        }

        case 'thumb': {
            $app = $loadApp((int)($_GET['id'] ?? 0));
            sendDataUri($app['thumbnail'] ?? null);
        }

        case 'categories':
            $q = $conn->query("SELECT c.id, c.name, c.slug, c.image, c.is_active, 
                  (SELECT COUNT(*) FROM shop_product_categories pc WHERE pc.category_id = c.id) as product_count 
                FROM shop_categories c ORDER BY c.sort_order, c.name")->fetchAll(PDO::FETCH_ASSOC);
            out(['status' => 'success', 'data' => $q]);

        case 'category_save': {
            $id = (int)($body['id'] ?? 0);
            $name = trim($body['name'] ?? '');
            $slug = trim($body['slug'] ?? '');
            $image = trim($body['image'] ?? '');
            $is_active = (int)!empty($body['is_active']);
            if (!$name || !$slug) out(['status' => 'error', 'message' => 'Name and slug required'], 400);
            
            if ($id > 0) {
                $conn->prepare("UPDATE shop_categories SET name=?, slug=?, image=?, is_active=? WHERE id=?")->execute([$name, $slug, $image, $is_active, $id]);
            } else {
                $conn->prepare("INSERT INTO shop_categories (name, slug, image, is_active) VALUES (?,?,?,?)")->execute([$name, $slug, $image, $is_active]);
                $id = $conn->lastInsertId();
            }
            out(['status' => 'success', 'id' => $id]);
        }

        case 'category_image': {
            if (!isset($_FILES['file'])) out(['status' => 'error', 'message' => 'No file'], 400);
            $f = $_FILES['file'];
            if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > 2 * 1024 * 1024) out(['status' => 'error', 'message' => 'Upload error or >2MB'], 400);
            
            $dir = __DIR__ . '/../../../storage/uploads/category';
            if (!is_dir($dir)) mkdir($dir, 0775, true);
            $filename = uniqid('cat_') . '.png';
            $path = "$dir/$filename";
            
            if (function_exists('imagecreatefromstring')) {
                $im = @imagecreatefromstring(file_get_contents($f['tmp_name']));
                if ($im) {
                    imagepng($im, $path);
                    imagedestroy($im);
                } else move_uploaded_file($f['tmp_name'], $path);
            } else move_uploaded_file($f['tmp_name'], $path);
            
            out(['status' => 'success', 'url' => "/api/shop_manage?action=get_cat_image&file=$filename"]);
        }

        case 'live': {
            $rows = $conn->query("SELECT s.id, s.name, s.campus, s.is_open, s.is_active, (s.logo IS NOT NULL AND s.logo <> '') AS has_image,
                    (SELECT COUNT(*) FROM shop_products p WHERE p.store_id = s.id AND p.is_active = 1) AS product_count
                FROM shop_stores s ORDER BY s.id DESC")->fetchAll(PDO::FETCH_ASSOC);
            out(['status' => 'success', 'data' => $rows]);
        }

        case 'store_image': {
            $id = (int)($_GET['id'] ?? 0);
            $path = __DIR__ . '/../../../storage/uploads/store/' . $id . '.png';
            if (file_exists($path)) {
                header('Content-Type: image/png');
                header('Cache-Control: public, max-age=86400');
                readfile($path);
                exit();
            }
            http_response_code(404);
            exit();
        }

        case 'reject': {
            $id = (int)($body['id'] ?? 0);
            $u = $lite->prepare("UPDATE shop_applications SET status='rejected', reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'");
            $u->execute([$user_id, $id]);
            if (!$u->rowCount()) out(['status' => 'error', 'message' => 'Application is not pending'], 409);
            out(['status' => 'success']);
        }

        case 'merge': {
            $id = (int)($body['id'] ?? 0);
            $allowed = ['UNI1', 'UNI2', 'OLD_CAMPUS', 'NEW_CAMPUS'];
            $campus = array_values(array_intersect($allowed, $body['campus'] ?? []));
            if (!$campus) out(['status' => 'error', 'message' => 'Select at least one campus'], 422);

            $app = $loadApp($id);
            if (!$app) out(['status' => 'error', 'message' => 'Not found'], 404);
            $custom = json_decode($app['custom_categories'], true) ?: [];
            $map = $body['map'] ?? [];
            foreach ($custom as $c) {
                $d = $map[$c] ?? ['mode' => 'new'];
                if (($d['mode'] ?? '') === 'map' && empty($d['category_id'])) out(['status' => 'error', 'message' => "Pick a category to map '$c' to"], 422);
            }

            // Claim the application so a double click can't merge twice
            $claim = $lite->prepare("UPDATE shop_applications SET status='merging' WHERE id=? AND status='pending'");
            $claim->execute([$id]);
            if (!$claim->rowCount()) out(['status' => 'error', 'message' => 'Application is not pending'], 409);

            try {
                $conn->beginTransaction();
                $catIds = array_map('intval', json_decode($app['categories'], true) ?: []);

                foreach ($custom as $c) {
                    $d = $map[$c] ?? ['mode' => 'new'];
                    if (($d['mode'] ?? '') === 'map') {
                        $catIds[] = (int)$d['category_id'];
                    } else {
                        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($c)), '-') ?: 'category';
                        $ex = $conn->prepare("SELECT id FROM shop_categories WHERE slug = ? OR LOWER(name) = LOWER(?) LIMIT 1");
                        $ex->execute([$slug, $c]);
                        $existing = $ex->fetchColumn();
                        if ($existing) { $catIds[] = (int)$existing; continue; }
                        $conn->prepare("INSERT INTO shop_categories (slug, name, description) VALUES (?,?,?)")->execute([$slug, $c, '']);
                        $catIds[] = (int)$conn->lastInsertId();
                    }
                }
                $catIds = array_values(array_unique($catIds));

                $storeId = random_int(1000000, 9999999);
                while ($conn->query("SELECT id FROM shop_stores WHERE id = $storeId")->fetchColumn()) {
                    $storeId = random_int(1000000, 9999999);
                }

                $conn->prepare("INSERT INTO shop_stores (id, name, description, logo, banner, campus) VALUES (?,?,?,?,?,?)")
                    ->execute([$storeId, $app['name'], $app['description'], '', '', implode(',', $campus)]);

                if ($app['thumbnail'] && preg_match('#^data:image/(jpeg|png|webp|gif);base64,(.+)$#s', $app['thumbnail'], $m)) {
                    $imgData = base64_decode($m[2]);
                    $storeDir = __DIR__ . '/../../../storage/uploads/store';
                    if (!is_dir($storeDir)) @mkdir($storeDir, 0775, true);
                    $path = $storeDir . '/' . $storeId . '.png';
                    
                    if (function_exists('imagecreatefromstring')) {
                        $im = @imagecreatefromstring($imgData);
                        if ($im) {
                            imagepng($im, $path);
                            imagedestroy($im);
                        } else {
                            file_put_contents($path, $imgData);
                        }
                    } else {
                        file_put_contents($path, $imgData);
                    }
                    $conn->prepare("UPDATE shop_stores SET logo=?, banner=? WHERE id=?")->execute(['1', '1', $storeId]);
                }

                $so = $conn->prepare("INSERT IGNORE INTO shop_store_owners (store_id, user_id, mobile, role) VALUES (?,?,?, 'owner')");
                foreach (json_decode($app['owners'], true) ?: [] as $o) $so->execute([$storeId, (int)$o['id'], $o['mobile'] ?? null]);

                $sc = $conn->prepare("INSERT IGNORE INTO shop_store_categories (store_id, category_id) VALUES (?,?)");
                foreach ($catIds as $cid) $sc->execute([$storeId, $cid]);

                $conn->commit();
            } catch (Throwable $e) {
                if ($conn->inTransaction()) $conn->rollBack();
                $lite->prepare("UPDATE shop_applications SET status='pending' WHERE id=?")->execute([$id]);
                throw $e;
            }

            $lite->prepare("UPDATE shop_applications SET status='approved', merged_store_id=?, reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=?")
                ->execute([$storeId, $user_id, $id]);
                
            // Send WhatsApp Notification to Owners
            require_once __DIR__ . '/../../includes/EvolutionAPI.php';
            foreach (json_decode($app['owners'], true) ?: [] as $o) {
                if (!empty($o['mobile'])) {
                    EvolutionAPI::sendOrderMessage('shop_approved', $o['mobile'], $app['name']);
                }
            }

            out(['status' => 'success', 'data' => ['store_id' => $storeId]]);
        }
    }
    out(['status' => 'error', 'message' => 'Unknown action'], 400);
} catch (Throwable $e) {
    out(['status' => 'error', 'message' => 'Server error', 'debug' => $e->getMessage()], 500);
}
