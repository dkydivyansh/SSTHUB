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

$data = json_decode(file_get_contents('php://input'), true);
$group_id = $data['group_id'] ?? '';
$type = $data['type'] ?? '';

if (empty($group_id) || empty($type) || !in_array($type, ['announcements', 'events'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'group_id and valid type are required']);
    exit();
}

try {
    // Get max id for the given type and group
    $stmt = $conn->prepare("SELECT MAX(id) FROM $type WHERE groupid = ?");
    $stmt->execute([$group_id]);
    $max_id = $stmt->fetchColumn() ?: 0;

    // Update group_members table
    $column = $type === 'announcements' ? 'last_read_announcements' : 'last_read_events';
    
    // Only update if max_id is greater than current to prevent going backwards
    $stmt = $conn->prepare("UPDATE group_members SET $column = GREATEST($column, ?) WHERE group_id = ? AND user_id = ?");
    $stmt->execute([$max_id, $group_id, $user_id]);

    echo json_encode(['status' => 'success', 'message' => 'Marked as read']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'debug' => $e->getMessage()]);
}
