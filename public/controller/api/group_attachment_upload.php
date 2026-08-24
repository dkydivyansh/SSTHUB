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
if ($status === 'invalid_session' || $status === 'disabled') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid session']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$group_id = $_POST['group_id'] ?? null;
$file_uuid = $_POST['file_uuid'] ?? null;
$chunk_index = isset($_POST['chunk_index']) ? (int)$_POST['chunk_index'] : null;
$total_chunks = isset($_POST['total_chunks']) ? (int)$_POST['total_chunks'] : null;
$original_name = $_POST['original_name'] ?? 'file';
$mime_type = $_POST['mime_type'] ?? 'application/octet-stream';

if (!$group_id || !$file_uuid || $chunk_index === null || $total_chunks === null || !isset($_FILES['chunk'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields or chunk data']);
    exit();
}

// 1. Validate file extension and MIME type to allow only images and videos
$ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
$allowed_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'ogg'];
$allowed_mime_prefixes = ['image/', 'video/'];

$is_allowed_mime = false;
foreach ($allowed_mime_prefixes as $prefix) {
    if (strpos($mime_type, $prefix) === 0) {
        $is_allowed_mime = true;
        break;
    }
}

if (!$is_allowed_mime || !in_array($ext, $allowed_exts)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Only image and video files are allowed.']);
    exit();
}

// 2. Verify group participation
$stmt = $conn->prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?");
$stmt->execute([$group_id, $user_id]);
if (!$stmt->fetch()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Not a member of this group']);
    exit();
}

$upload_dir = __DIR__ . '/../../../storage/uploads/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$tmp_path = $upload_dir . 'tmp_grp_' . $file_uuid;
$final_path = $upload_dir . 'grp_' . $file_uuid . '.bin';

// Append chunk to tmp file
$chunk_data = file_get_contents($_FILES['chunk']['tmp_name']);
if (file_put_contents($tmp_path, $chunk_data, FILE_APPEND) === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save chunk']);
    exit();
}

// Check size during upload to enforce 50MB limit (52,428,800 bytes)
$MAX_SIZE = 50 * 1024 * 1024;
if (filesize($tmp_path) > $MAX_SIZE) {
    unlink($tmp_path);
    http_response_code(413);
    echo json_encode(['status' => 'error', 'message' => 'File size exceeds 50MB limit']);
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
        $stmt = $conn->prepare("INSERT INTO group_attachments (id, user_id, group_id, original_name, mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$file_uuid, $user_id, $group_id, $original_name, $mime_type, $file_size]);
        
        echo json_encode(['status' => 'success', 'data' => ['file_uuid' => $file_uuid, 'completed' => true]]);
    } catch (PDOException $e) {
        // Cleanup if DB fails
        unlink($final_path);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'success', 'data' => ['completed' => false, 'chunk_index' => $chunk_index]]);
}
