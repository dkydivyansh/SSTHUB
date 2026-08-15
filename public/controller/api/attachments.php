<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;

if (!$user_id || !$session_id) {
    http_response_code(401);
    exit();
}

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);

$status = $sessionManager->validateSessionStatus($user_id, $session_id);
if ($status === 'invalid_session') {
    http_response_code(401);
    exit();
}

$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/api/attachments/([^/]+)$#', $request_uri, $matches)) {
    $uuid = $matches[1];
    
    $stmt = $conn->prepare("SELECT * FROM attachments WHERE id = ?");
    $stmt->execute([$uuid]);
    $attachment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$attachment) {
        http_response_code(404);
        exit();
    }
    
    // Verify participation
    $stmt = $conn->prepare("SELECT 1 FROM participants WHERE conversation_id = ? AND user_id = ?");
    $stmt->execute([$attachment['conversation_id'], $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        exit();
    }
    
    $file_path = __DIR__ . '/../../../storage/uploads/' . $uuid . '.bin';
    if (!file_exists($file_path)) {
        http_response_code(404);
        exit();
    }
    
    header('Content-Type: ' . $attachment['mime_type']);
    header('Content-Length: ' . filesize($file_path));
    
    if (strpos($attachment['mime_type'], 'image') === false && strpos($attachment['mime_type'], 'video') === false) {
        header('Content-Disposition: attachment; filename="' . basename($attachment['original_name']) . '"');
    } else {
        header('Content-Disposition: inline; filename="' . basename($attachment['original_name']) . '"');
    }
    
    readfile($file_path);
    exit();
}
