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

$group_id = $_GET['group_id'] ?? '';
$type = $_GET['type'] ?? 'all';
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$limit = 20;

if (empty($group_id)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group ID is required']);
    exit();
}

try {
    // Check membership and fetch group details
    $stmt = $conn->prepare("
        SELECT g.name, g.description, g.logo, m.joined_at 
        FROM community_groups g
        JOIN group_members m ON g.id = m.group_id
        WHERE g.id = ? AND m.user_id = ?
    ");
    $stmt->execute([$group_id, $user_id]);
    $group_info = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$group_info) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Not authorized to view this group']);
        exit();
    }
    
    // Check if user is an admin
    $stmt = $conn->prepare("SELECT userids FROM groupadmin WHERE groupid = ?");
    $stmt->execute([$group_id]);
    $admin_row = $stmt->fetch(PDO::FETCH_ASSOC);
    $is_admin = false;
    if ($admin_row && $admin_row['userids']) {
        $admin_ids = json_decode($admin_row['userids'], true);
        if (is_array($admin_ids) && in_array($user_id, $admin_ids)) {
            $is_admin = true;
        }
    }
    $group_info['is_admin'] = $is_admin;
    
    $data = [];
    if ($type === 'announcements') {
        $stmt = $conn->prepare("SELECT id, 'announcement' as post_type, context, created_at, pinned, extras, created_by FROM announcements WHERE groupid = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $group_id, PDO::PARAM_STR);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($type === 'events') {
        $stmt = $conn->prepare("SELECT id, 'event' as post_type, context, created_at, pinned, extras, created_by FROM events WHERE groupid = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $group_id, PDO::PARAM_STR);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $sql = "
            (SELECT id, 'announcement' as post_type, context, created_at, pinned, extras, created_by FROM announcements WHERE groupid = ?)
            UNION ALL
            (SELECT id, 'event' as post_type, context, created_at, pinned, extras, created_by FROM events WHERE groupid = ?)
            ORDER BY created_at DESC LIMIT ? OFFSET ?
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bindValue(1, $group_id, PDO::PARAM_STR);
        $stmt->bindValue(2, $group_id, PDO::PARAM_STR);
        $stmt->bindValue(3, $limit, PDO::PARAM_INT);
        $stmt->bindValue(4, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    foreach($data as &$row) {
        $row['context'] = $row['context'] ? json_decode($row['context'], true) : null;
        $row['extras'] = $row['extras'] ? json_decode($row['extras'], true) : null;
    }
    
    echo json_encode(['status' => 'success', 'data' => $data, 'group' => $group_info]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Internal server error: ' . $e->getMessage()]);
}
