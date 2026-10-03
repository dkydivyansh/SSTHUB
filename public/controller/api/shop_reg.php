<?php
/**
 * Shop registration applications (temporary storage in SQLite, reviewed before moving to MySQL shop_stores).
 *
 *   GET  /api/shop_reg?action=me              -> current user (auto owner) + my applications
 *   GET  /api/shop_reg?action=search&q=...    -> find registered users by email / roll no / name
 *   POST /api/shop_reg  {name, description, thumbnail(base64 data URI, <=2MB), owners[{ident, mobile}] (index 0 = you), categories[], custom_categories[]}  -> submit
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
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

/** Looks up an active, registered user by email, roll no or exact id. */
function findUser(PDO $conn, string $ident) {
    $stmt = $conn->prepare("SELECT u.id, u.email, ud.name, ud.rollno, ud.avatar
        FROM users u JOIN userdata ud ON ud.user_id = u.id
        WHERE ud.status = 'active' AND (LOWER(u.email) = LOWER(?) OR LOWER(ud.rollno) = LOWER(?)) LIMIT 1");
    $stmt->execute([$ident, $ident]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

// --- SQLite (temporary applications store) ---
if (!extension_loaded('pdo_sqlite')) out(['status' => 'error', 'message' => 'pdo_sqlite PHP extension is not enabled'], 500);
$dir = __DIR__ . '/../../../storage';
if (!is_dir($dir)) @mkdir($dir, 0775, true);
$lite = new PDO('sqlite:' . $dir . '/shop_reg.sqlite');
$lite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$lite->exec("CREATE TABLE IF NOT EXISTS shop_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail TEXT,
    owners TEXT NOT NULL,       -- JSON array of {id, mobile}
    categories TEXT NOT NULL,   -- JSON array of category ids
    custom_categories TEXT NOT NULL DEFAULT '[]', -- JSON array of free-text categories ("Other")
    status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");
$lite->exec("CREATE INDEX IF NOT EXISTS idx_shop_app_applicant ON shop_applications(applicant_id)");
$lite->exec("CREATE INDEX IF NOT EXISTS idx_shop_app_status ON shop_applications(status)");
// Upgrade tables created before custom categories existed
$cols = array_column($lite->query("PRAGMA table_info(shop_applications)")->fetchAll(PDO::FETCH_ASSOC), 'name');
if (!in_array('custom_categories', $cols)) $lite->exec("ALTER TABLE shop_applications ADD COLUMN custom_categories TEXT NOT NULL DEFAULT '[]'");

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'me';

        if ($action === 'search') {
            $q = trim($_GET['q'] ?? '');
            if (strlen($q) < 3) out(['status' => 'success', 'data' => []]);
            $stmt = $conn->prepare("SELECT u.id, u.email, ud.name, ud.rollno, ud.avatar
                FROM users u JOIN userdata ud ON ud.user_id = u.id
                WHERE ud.status = 'active' AND u.id != ? AND (u.email LIKE ? OR ud.rollno LIKE ? OR ud.name LIKE ?) LIMIT 8");
            $like = '%' . $q . '%';
            $stmt->execute([$user_id, $like, $like, $like]);
            out(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }

        $stmt = $conn->prepare("SELECT u.id, u.email, ud.name, ud.rollno, ud.avatar FROM users u LEFT JOIN userdata ud ON ud.user_id = u.id WHERE u.id = ?");
        $stmt->execute([$user_id]);
        $me = $stmt->fetch(PDO::FETCH_ASSOC);
        $apps = $lite->prepare("SELECT id, name, status, created_at FROM shop_applications WHERE applicant_id = ? ORDER BY id DESC");
        $apps->execute([$user_id]);
        out(['status' => 'success', 'data' => ['me' => $me, 'applications' => $apps->fetchAll(PDO::FETCH_ASSOC)]]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['status' => 'error', 'message' => 'Method not allowed'], 405);

    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $name = trim($in['name'] ?? '');
    $desc = trim($in['description'] ?? '');
    $thumb = $in['thumbnail'] ?? null;
    $cats = array_values(array_unique(array_map('intval', $in['categories'] ?? [])));
    $custom = [];
    foreach (($in['custom_categories'] ?? []) as $c) {
        $c = trim((string)$c);
        if ($c === '') continue;
        if (mb_strlen($c) > 40) out(['status' => 'error', 'message' => 'Custom category max 40 characters'], 422);
        $custom[mb_strtolower($c)] = $c;
    }
    $custom = array_values($custom);
    if (count($custom) > 5) out(['status' => 'error', 'message' => 'Maximum 5 custom categories'], 422);

    if (strlen($name) < 3 || strlen($name) > 80) out(['status' => 'error', 'message' => 'Shop name must be 3-80 characters'], 422);
    if (strlen($desc) < 10 || strlen($desc) > 1000) out(['status' => 'error', 'message' => 'Description must be 10-1000 characters'], 422);
    if (!$cats && !$custom) out(['status' => 'error', 'message' => 'Select at least one category'], 422);
    // Thumbnail: base64 data URI, original file <= 2MB (base64 is ~4/3 larger)
    if (!$thumb || !preg_match('#^data:image/(jpeg|png|webp|gif);base64,#', $thumb) || strlen($thumb) > 2 * 1024 * 1024 * 4 / 3 + 200) {
        out(['status' => 'error', 'message' => 'A valid thumbnail image is required (max 2MB)'], 422);
    }

    // Owners: index 0 is the logged-in user (mobile only); others must be registered users. Each needs a mobile no.
    $mobileOk = fn($m) => preg_match('/^[0-9]{10}$/', $m);
    $list = $in['owners'] ?? [];
    if (!$list || !isset($list[0])) out(['status' => 'error', 'message' => 'Your mobile number is required'], 422);
    $mine = preg_replace('/\D/', '', (string)($list[0]['mobile'] ?? ''));
    if (!$mobileOk($mine)) out(['status' => 'error', 'message' => 'Enter a valid 10-digit mobile number for yourself'], 422);
    $owners = [$user_id => ['id' => $user_id, 'mobile' => $mine]];
    foreach (array_slice($list, 1) as $o) {
        $ident = trim((string)($o['ident'] ?? ''));
        $u = findUser($conn, $ident);
        if (!$u) out(['status' => 'error', 'message' => "Owner '$ident' is not registered on this platform"], 422);
        $m = preg_replace('/\D/', '', (string)($o['mobile'] ?? ''));
        if (!$mobileOk($m)) out(['status' => 'error', 'message' => "Enter a valid 10-digit mobile number for $ident"], 422);
        $owners[(int)$u['id']] = ['id' => (int)$u['id'], 'mobile' => $m];
    }
    $owners = array_values($owners);
    if (count($owners) > 5) out(['status' => 'error', 'message' => 'Maximum 5 owners'], 422);

    $pending = $lite->prepare("SELECT COUNT(*) FROM shop_applications WHERE applicant_id = ? AND status = 'pending'");
    $pending->execute([$user_id]);
    if ((int)$pending->fetchColumn() >= 3) out(['status' => 'error', 'message' => 'You already have 3 pending applications'], 429);

    $ins = $lite->prepare("INSERT INTO shop_applications (applicant_id, name, description, thumbnail, owners, categories, custom_categories) VALUES (?,?,?,?,?,?,?)");
    $ins->execute([$user_id, $name, $desc, $thumb, json_encode($owners), json_encode($cats), json_encode($custom, JSON_UNESCAPED_UNICODE)]);
    out(['status' => 'success', 'data' => ['id' => (int)$lite->lastInsertId()]]);
} catch (Exception $e) {
    out(['status' => 'error', 'message' => 'Server error', 'debug' => $e->getMessage()], 500);
}
