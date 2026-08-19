<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

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

$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$limit = 20;

try {
    // Get all groups the user is a member of
    $stmt = $conn->prepare("SELECT group_id FROM group_members WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $groups = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($groups)) {
        echo json_encode(['status' => 'success', 'data' => []]);
        exit();
    }

    $placeholders = str_repeat('?,', count($groups) - 1) . '?';

    $sql = "
        SELECT a.id, a.groupid, 'announcement' as post_type, a.context, a.created_at, a.pinned, a.extras, a.created_by,
               g.name as group_name, g.logo as group_logo
        FROM announcements a
        JOIN community_groups g ON a.groupid = g.id
        WHERE a.groupid IN ($placeholders)
        UNION ALL
        SELECT e.id, e.groupid, 'event' as post_type, e.context, e.created_at, e.pinned, e.extras, e.created_by,
               g.name as group_name, g.logo as group_logo
        FROM events e
        JOIN community_groups g ON e.groupid = g.id
        WHERE e.groupid IN ($placeholders)
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ";

    $params = array_merge($groups, $groups, [$limit, $offset]);

    $stmt = $conn->prepare($sql);
    foreach ($params as $i => $value) {
        $stmt->bindValue($i + 1, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach($data as &$row) {
        $row['context'] = $row['context'] ? json_decode($row['context'], true) : null;
        $row['extras'] = $row['extras'] ? json_decode($row['extras'], true) : null;
    }

    echo json_encode(['status' => 'success', 'data' => $data]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Internal server error: ' . $e->getMessage()]);
}
