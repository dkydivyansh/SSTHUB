<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../includes/db.php';

$user_id = $_COOKIE['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    exit(json_encode(['status' => 'error', 'message' => 'Unauthorized']));
}

$group_id = $_GET['group_id'] ?? '';
if (!$group_id) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Group ID required']));
}

$db = new Database();
$conn = $db->getConnection();

try {
    $stmt = $conn->prepare("SELECT last_read_announcements, last_read_events FROM group_members WHERE group_id = ? AND user_id = ?");
    $stmt->execute([$group_id, $user_id]);
    $gm = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$gm) {
        http_response_code(403);
        exit(json_encode(['status' => 'error', 'message' => 'Not a member']));
    }

    $stmt_ann = $conn->prepare("SELECT COUNT(*) FROM announcements WHERE groupid = ? AND id > ?");
    $stmt_ann->execute([$group_id, $gm['last_read_announcements']]);
    $unread_announcements = (int)$stmt_ann->fetchColumn();

    $stmt_ev = $conn->prepare("SELECT COUNT(*) FROM events WHERE groupid = ? AND id > ?");
    $stmt_ev->execute([$group_id, $gm['last_read_events']]);
    $unread_events = (int)$stmt_ev->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'announcements' => $unread_announcements,
            'events' => $unread_events
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['status' => 'error', 'message' => 'Database error']));
}
