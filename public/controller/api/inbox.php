<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;

if (!$user_id || !$session_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Missing session cookies']);
    exit();
}

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);

$status = $sessionManager->validateSessionStatus($user_id, $session_id);
if ($status === 'invalid_session') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid session']);
    exit();
}

$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($request_uri !== '/api/inbox') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid route']);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT 
            c.id AS conversation_id,
            c.type AS chat_type,
            p.joined_at,
            p.is_archived,
            (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != p.user_id AND m.id > COALESCE(p.last_seen_message_id, 0)) as unread_count,
            (
                SELECT ud.name 
                FROM participants p2 
                JOIN userdata ud ON p2.user_id = ud.user_id 
                WHERE p2.conversation_id = c.id AND p2.user_id != ? 
                LIMIT 1
            ) as other_user_name,
            (
                SELECT ud.avatar 
                FROM participants p2 
                JOIN userdata ud ON p2.user_id = ud.user_id 
                WHERE p2.conversation_id = c.id AND p2.user_id != ? 
                LIMIT 1
            ) as other_user_avatar,
            (
                SELECT ud.rollno 
                FROM participants p2 
                JOIN userdata ud ON p2.user_id = ud.user_id 
                WHERE p2.conversation_id = c.id AND p2.user_id != ? 
                LIMIT 1
            ) as other_user_rollno,
            (
                SELECT ud.type 
                FROM participants p2 
                JOIN userdata ud ON p2.user_id = ud.user_id 
                WHERE p2.conversation_id = c.id AND p2.user_id != ? 
                LIMIT 1
            ) as other_user_type
        FROM participants p
        JOIN conversations c ON p.conversation_id = c.id
        WHERE p.user_id = ?
        ORDER BY COALESCE(last_message_time, c.created_at) DESC
    ");
    $stmt->execute([$user_id, $user_id, $user_id, $user_id, $user_id]);
    $inbox = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $inbox]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'debug' => $e->getMessage()]);
}
?>
