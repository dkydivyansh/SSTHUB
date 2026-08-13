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

// Validate session
$status = $sessionManager->validateSessionStatus($user_id, $session_id);

if ($status === 'invalid_session') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid session']);
    exit();
}

// Fetch user data
$stmt = $conn->prepare("
    SELECT u.id as userid, u.email, u.sso, 
           ud.name, ud.rollno, ud.batch, ud.avatar, ud.type, ud.status, ud.extra, ud.group
    FROM users u
    JOIN userdata ud ON u.id = ud.user_id
    WHERE u.id = ? LIMIT 1
");
$stmt->execute([$user_id]);
$userData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userData) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit();
}

// Append session status so frontend knows if it needs to trigger a refresh
$userData['session_status'] = $status;

echo json_encode([
    'status' => 'success',
    'data' => $userData
]);
?>
