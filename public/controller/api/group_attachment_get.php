<?php
// Prevent unwanted caching for dynamic files or handle headers properly for cached ones.
// We will rely on standard cache-control based on our needs.

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;

if (!$user_id || !$session_id) {
    http_response_code(401);
    echo "Unauthorized";
    exit();
}

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);

$status = $sessionManager->validateSessionStatus($user_id, $session_id);
if ($status === 'invalid_session' || $status === 'disabled') {
    http_response_code(401);
    echo "Unauthorized: Invalid session";
    exit();
}

$file_id = $_GET['id'] ?? null;

if (!$file_id) {
    http_response_code(400);
    echo "Missing file ID";
    exit();
}

try {
    $stmt = $conn->prepare("SELECT group_id, mime_type, original_name, file_size FROM group_attachments WHERE id = ?");
    $stmt->execute([$file_id]);
    $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$attachment) {
        http_response_code(404);
        echo "File not found in database";
        exit();
    }

    $group_id = $attachment['group_id'];

    // Verify group participation
    $stmt = $conn->prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?");
    $stmt->execute([$group_id, $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo "Forbidden: You do not have access to this group's files";
        exit();
    }

    $file_path = __DIR__ . '/../../../storage/uploads/grp_' . $file_id . '.bin';

    if (!file_exists($file_path)) {
        http_response_code(404);
        echo "File not found on disk";
        exit();
    }

    // Set headers for file download/display
    header("Content-Type: " . $attachment['mime_type']);
    header("Content-Length: " . filesize($file_path));
    
    // Check if it's an image or video to display inline, else attachment
    $is_inline = (strpos($attachment['mime_type'], 'image/') === 0 || strpos($attachment['mime_type'], 'video/') === 0);
    $disposition = $is_inline ? 'inline' : 'attachment';
    
    header("Content-Disposition: {$disposition}; filename=\"" . addslashes($attachment['original_name']) . "\"");
    header("Cache-Control: public, max-age=86400"); // Cache for 1 day

    // Clear output buffer and stream file
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($file_path);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo "Database error";
    exit();
}
