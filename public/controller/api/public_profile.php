<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

$rollno = $_GET['rollno'] ?? null;

if (!$rollno) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing rollno parameter']);
    exit();
}

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);

// Check if requester has a valid session (to determine if logged in or guest)
$requester_user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;
$is_logged_in = false;

if ($requester_user_id && $session_id) {
    $status = $sessionManager->validateSessionStatus($requester_user_id, $session_id);
    if ($status === 'valid') {
        $is_logged_in = true;
    }
}

// Fetch user data
$stmt = $conn->prepare("
    SELECT u.id as userid, u.email, 
           ud.name, ud.rollno, ud.batch, ud.avatar, ud.type, ud.extra, ud.group
    FROM users u
    JOIN userdata ud ON u.id = ud.user_id
    WHERE ud.rollno = ? LIMIT 1
");
$stmt->execute([$rollno]);
$userData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userData) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit();
}

$extra = json_decode($userData['extra'], true);
$is_private = isset($extra['disable_public_profile']) ? (bool)$extra['disable_public_profile'] : false;

// Format email based on auth status
$email = $userData['email'];
if (!$is_logged_in) {
    // Mask email for guests: d***@gmail.com
    $parts = explode('@', $email);
    if (count($parts) === 2) {
        $name = $parts[0];
        if (strlen($name) > 1) {
            $masked_name = substr($name, 0, 1) . str_repeat('*', strlen($name) - 1);
        } else {
            $masked_name = '*';
        }
        $email = $masked_name . '@' . $parts[1];
    } else {
        $email = '***@***.***';
    }
}

if ($is_private) {
    // Return sanitized data
    echo json_encode([
        'status' => 'success',
        'data' => [
            'userid' => $userData['userid'],
            'name' => $userData['name'],
            'avatar' => $userData['avatar'],
            'is_private' => true,
            'is_logged_in_viewer' => $is_logged_in
        ]
    ]);
} else {
    // Return full public profile
    echo json_encode([
        'status' => 'success',
        'data' => [
            'userid' => $userData['userid'],
            'name' => $userData['name'],
            'avatar' => $userData['avatar'],
            'email' => $email,
            'type' => $userData['type'],
            'batch' => $userData['batch'],
            'group' => $userData['group'],
            'rollno' => $userData['rollno'],
            'extra' => $userData['extra'],
            'is_private' => false,
            'is_logged_in_viewer' => $is_logged_in
        ]
    ]);
}
?>
