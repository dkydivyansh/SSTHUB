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
if ($status === 'invalid_session') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid session']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$conversation_id = $_POST['conversation_id'] ?? null;
$file_uuid = $_POST['file_uuid'] ?? null;
$chunk_index = isset($_POST['chunk_index']) ? (int)$_POST['chunk_index'] : null;
$total_chunks = isset($_POST['total_chunks']) ? (int)$_POST['total_chunks'] : null;
$original_name = $_POST['original_name'] ?? 'file';
$mime_type = $_POST['mime_type'] ?? 'application/octet-stream';

if (!$conversation_id || !$file_uuid || $chunk_index === null || $total_chunks === null || !isset($_FILES['chunk'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields or chunk data']);
    exit();
}

// Verify conversation participation
$stmt = $conn->prepare("SELECT 1 FROM participants WHERE conversation_id = ? AND user_id = ?");
$stmt->execute([$conversation_id, $user_id]);
if (!$stmt->fetch()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit();
}

$upload_dir = __DIR__ . '/../../../storage/uploads/';
$tmp_path = $upload_dir . 'tmp_' . $file_uuid;
$final_path = $upload_dir . $file_uuid . '.bin';

// Append chunk to tmp file
$chunk_data = file_get_contents($_FILES['chunk']['tmp_name']);
if (file_put_contents($tmp_path, $chunk_data, FILE_APPEND) === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save chunk']);
    exit();
}

// If this is the last chunk
if ($chunk_index === $total_chunks - 1) {
    if (!rename($tmp_path, $final_path)) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to finalize file']);
        exit();
    }
    
    $file_size = filesize($final_path);
    
    try {
        $stmt = $conn->prepare("INSERT INTO attachments (id, user_id, conversation_id, original_name, mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$file_uuid, $user_id, $conversation_id, $original_name, $mime_type, $file_size]);
        
        echo json_encode(['status' => 'success', 'data' => ['file_uuid' => $file_uuid, 'completed' => true]]);
    } catch (PDOException $e) {
        // Cleanup if DB fails
        unlink($final_path);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
} else {
    echo json_encode(['status' => 'success', 'data' => ['completed' => false, 'chunk_index' => $chunk_index]]);
}
