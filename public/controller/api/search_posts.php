<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

// Only accept GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;

if (!$user_id || !$session_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);

$status = $sessionManager->validateSessionStatus($user_id, $session_id);
if ($status === 'invalid_session' || $status === 'disabled') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$group_id = $_GET['group_id'] ?? '';
$query = trim($_GET['q'] ?? '');
$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

if (empty($group_id)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'group_id is required']);
    exit();
}

if (empty($query)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Search query (q) is required']);
    exit();
}

$post_type = $_GET['type'] ?? '';

try {
    // Verify membership
    $stmt = $conn->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $stmt->execute([$group_id, $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'You are not a member of this group']);
        exit();
    }

    $searchParam = '%' . $query . '%';
    $params = [];
    
    $sql_announcements = "
        SELECT id, groupid, 'announcement' AS post_type, context, extras, created_at, created_by
        FROM announcements
        WHERE groupid = ?
          AND (
            JSON_UNQUOTE(JSON_EXTRACT(context, '$.title')) LIKE ?
            OR JSON_UNQUOTE(JSON_EXTRACT(context, '$.content')) LIKE ?
            OR JSON_UNQUOTE(JSON_EXTRACT(context, '$.tags')) LIKE ?
          )
    ";
    
    $sql_events = "
        SELECT id, groupid, 'event' AS post_type, context, extras, created_at, created_by
        FROM events
        WHERE groupid = ?
          AND (
            JSON_UNQUOTE(JSON_EXTRACT(context, '$.title')) LIKE ?
            OR JSON_UNQUOTE(JSON_EXTRACT(context, '$.content')) LIKE ?
            OR JSON_UNQUOTE(JSON_EXTRACT(context, '$.tags')) LIKE ?
            OR JSON_UNQUOTE(JSON_EXTRACT(extras, '$.address')) LIKE ?
          )
    ";

    $sql = "";
    $limit_val = (int)($limit + 1);
    $offset_val = (int)$offset;

    if ($post_type === 'announcement') {
        $sql = $sql_announcements . " ORDER BY created_at DESC LIMIT {$limit_val} OFFSET {$offset_val}";
        $params = [$group_id, $searchParam, $searchParam, $searchParam];
    } else if ($post_type === 'event') {
        $sql = $sql_events . " ORDER BY created_at DESC LIMIT {$limit_val} OFFSET {$offset_val}";
        $params = [$group_id, $searchParam, $searchParam, $searchParam, $searchParam];
    } else {
        $sql = "SELECT * FROM (($sql_announcements) UNION ALL ($sql_events)) AS combined ORDER BY created_at DESC LIMIT {$limit_val} OFFSET {$offset_val}";
        $params = [
            $group_id, $searchParam, $searchParam, $searchParam,
            $group_id, $searchParam, $searchParam, $searchParam, $searchParam
        ];
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $has_more = count($results) > $limit;
    if ($has_more) {
        array_pop($results); // Remove the extra row
    }

    echo json_encode([
        'status' => 'success',
        'data' => $results,
        'page' => $page,
        'limit' => $limit,
        'has_more' => $has_more
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}
