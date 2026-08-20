<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;

if (!$user_id || !$session_id) {
    echo json_encode(['status' => 'success', 'data' => ['session_status' => 'invalid_session']]);
    exit();
}

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit();
}

$sessionManager = new SessionManager($conn);
$session_status = $sessionManager->validateSessionStatus($user_id, $session_id);

if ($session_status !== 'valid') {
    echo json_encode(['status' => 'success', 'data' => ['session_status' => $session_status]]);
    exit();
}

// Session is active, get user status
$stmt = $conn->prepare("SELECT name, avatar, type, status FROM userdata WHERE user_id = ?");
$stmt->execute([$user_id]);
$userData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userData) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit();
}

// Split name to get first name
$nameParts = explode(' ', trim($userData['name']));
$firstName = $nameParts[0];

echo json_encode([
    'status' => 'success',
    'data' => [
        'session_status' => 'active',
        'user_status' => $userData['status'],
        'name' => $userData['name'],
        'first_name' => $firstName,
        'avatar' => $userData['avatar'],
        'type' => $userData['type']
    ]
]);
?>
