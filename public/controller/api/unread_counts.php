<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';

$user_id = $_COOKIE['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$db = new Database();
$conn = $db->getConnection();

try {
    // Get total unread announcements across all groups the user has joined
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(
            (SELECT COUNT(*) FROM announcements a WHERE a.groupid = gm.group_id AND a.id > gm.last_read_announcements)
        ), 0) as total_unread_announcements
        FROM group_members gm
        WHERE gm.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $unread_announcements = (int)$stmt->fetchColumn();

    // Get total unread events across all groups the user has joined
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(
            (SELECT COUNT(*) FROM events e WHERE e.groupid = gm.group_id AND e.id > gm.last_read_events)
        ), 0) as total_unread_events
        FROM group_members gm
        WHERE gm.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $unread_events = (int)$stmt->fetchColumn();

    $total_community = $unread_announcements + $unread_events;

    // Optional: Could also return social unread counts if desired in future
    
    echo json_encode([
        'status' => 'success', 
        'data' => [
            'community' => $total_community
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'debug' => $e->getMessage()]);
}
