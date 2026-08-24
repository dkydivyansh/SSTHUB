<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

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
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$group_id = $data['group_id'] ?? '';
$post_id = $data['post_id'] ?? '';
$post_type = $data['post_type'] ?? '';
$title = trim($data['title'] ?? '');
$content = $data['content'] ?? '';
$tags = $data['tags'] ?? '';
$buttons = $data['buttons'] ?? null;

// Event-specific fields
$event_type = $data['event_type'] ?? 'virtual';
$event_time = $data['event_time'] ?? null;

// Validation
if (empty($group_id) || empty($post_id) || empty($post_type)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'group_id, post_id, and post_type are required']);
    exit();
}

if (!in_array($post_type, ['announcement', 'event'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'post_type must be announcement or event']);
    exit();
}
// No further validation needed for delete

try {
    // Verify membership
    $stmt = $conn->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $stmt->execute([$group_id, $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'You are not a member of this group']);
        exit();
    }

    // Check admin
    $stmt = $conn->prepare("SELECT userids FROM groupadmin WHERE groupid = ?");
    $stmt->execute([$group_id]);
    $admin_row = $stmt->fetch(PDO::FETCH_ASSOC);
    $is_admin = false;
    if ($admin_row && $admin_row['userids']) {
        $admin_ids = json_decode($admin_row['userids'], true);
        if (is_array($admin_ids) && in_array($user_id, $admin_ids)) {
            $is_admin = true;
        }
    }

    if (!$is_admin) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Only group admins can delete posts']);
        exit();
    }

    // Verify the post exists and belongs to this group
    $table = $post_type === 'event' ? 'events' : 'announcements';
    $stmt = $conn->prepare("SELECT id, extras FROM $table WHERE id = ? AND groupid = ?");
    $stmt->execute([$post_id, $group_id]);
    $existing_post = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing_post) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Post not found in this group']);
        exit();
    }
    
    $extras = json_decode($existing_post['extras'] ?? '{}', true);
    $featured = $extras['featured'] ?? null;
    
    if ($featured) {
        $del_stmt = $conn->prepare("DELETE FROM group_attachments WHERE id = ? AND group_id = ?");
        $del_stmt->execute([$featured, $group_id]);
        $file_path = __DIR__ . '/../../../storage/uploads/grp_' . $featured . '.bin';
        if (file_exists($file_path)) unlink($file_path);
    }

    // Delete the post
    $stmt = $conn->prepare("DELETE FROM $table WHERE id = ? AND groupid = ?");
    $stmt->execute([$post_id, $group_id]);

    echo json_encode([
        'status' => 'success',
        'message' => ucfirst($post_type) . ' deleted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}
