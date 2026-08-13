<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

// Only allow POST requests for the API
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Action is required']);
    exit();
}

$action = $input['action'] ?? null;
$user_id = $input['user_id'] ?? $_COOKIE['user_id'] ?? null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'user_id is required']);
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

switch ($action) {
    case 'validate':
        $session_id = $input['session_id'] ?? $_COOKIE['session_id'] ?? null;
        if (!$session_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'session_id required']);
            exit();
        }
        $status = $sessionManager->validateSessionStatus($user_id, $session_id);
        echo json_encode(['status' => 'success', 'data' => ['session_status' => $status]]);
        break;

    case 'refresh':
        $session_id = $input['session_id'] ?? $_COOKIE['session_id'] ?? null;
        $refresh_token = $input['refresh_token'] ?? $_COOKIE['refresh_token'] ?? null;
        if (!$session_id || !$refresh_token) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'session_id and refresh_token required']);
            exit();
        }
        $result = $sessionManager->refreshSession($user_id, $session_id, $refresh_token);
        if ($result) {
            setcookie('session_id', $result['session_id'], time() + (24 * 60 * 60), '/', '', false, true);
            setcookie('refresh_token', $result['refresh_token'], time() + (7 * 24 * 60 * 60), '/', '', false, true);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'invalid_session']);
        }
        break;

    case 'revoke':
        $session_id = $input['session_id'] ?? $_COOKIE['session_id'] ?? null;
        if (!$session_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'session_id required']);
            exit();
        }
        $success = $sessionManager->revokeSession($user_id, $session_id);
        if ($success) {
            // Unset cookies
            setcookie('session_id', '', time() - 3600, '/');
            setcookie('refresh_token', '', time() - 3600, '/');
            setcookie('user_id', '', time() - 3600, '/');
            echo json_encode(['status' => 'success', 'message' => 'session revoked']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'invalid_session']);
        }
        break;

    case 'revoke_device':
        $current_session_id = $input['current_session_id'] ?? null;
        $target_session_id = $input['target_session_id'] ?? null;
        if (!$current_session_id || !$target_session_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'current_session_id and target_session_id required']);
            exit();
        }
        $success = $sessionManager->revokeDevice($user_id, $current_session_id, $target_session_id);
        if ($success) {
            echo json_encode(['status' => 'success', 'message' => 'device session revoked']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'invalid_session']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'invalid action']);
        break;
}
?>
