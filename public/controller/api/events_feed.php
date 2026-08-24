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
$limit = 100; // Fetch more for grouping

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
        SELECT e.id, e.groupid, 'event' as post_type, e.context, e.created_at, e.pinned, e.extras, e.created_by,
               g.name as group_name, g.logo as group_logo
        FROM events e
        JOIN community_groups g ON e.groupid = g.id
        WHERE e.groupid IN ($placeholders)
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
    ";

    $params = array_merge($groups, [$limit, $offset]);

    $stmt = $conn->prepare($sql);
    foreach ($params as $i => $value) {
        $stmt->bindValue($i + 1, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode JSON fields
    foreach ($results as &$row) {
        if (isset($row['context'])) {
            $row['context'] = json_decode($row['context'], true);
        }
        if (isset($row['extras'])) {
            $row['extras'] = json_decode($row['extras'], true);
        }
        // Convert pinned to boolean
        $row['pinned'] = (bool)$row['pinned'];
    }

    echo json_encode(['status' => 'success', 'data' => $results]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
