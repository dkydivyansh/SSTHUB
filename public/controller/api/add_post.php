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
$post_type = $data['post_type'] ?? '';
$title = trim($data['title'] ?? '');
$content = $data['content'] ?? ''; // Already base64-encoded by frontend
$tags = $data['tags'] ?? '';
$buttons = $data['buttons'] ?? null;

// Event-specific fields
$event_type = $data['event_type'] ?? 'virtual';
$event_time = $data['event_time'] ?? null;

// Validation
if (empty($group_id) || empty($post_type) || empty($title)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'group_id, post_type, and title are required']);
    exit();
}

if (!in_array($post_type, ['announcement', 'event'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'post_type must be announcement or event']);
    exit();
}

if ($post_type === 'event' && !in_array($event_type, ['virtual', 'offline'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'event_type must be virtual or offline']);
    exit();
}

try {
    // Check membership
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
        echo json_encode(['status' => 'error', 'message' => 'Only group admins can create posts']);
        exit();
    }

    // Build context JSON
    $tags_array = [];
    if (!empty($tags)) {
        $tags_array = array_map('trim', explode(',', $tags));
        $tags_array = array_filter($tags_array); // Remove empty strings
        $tags_array = array_values($tags_array); // Re-index
    }

    $context = [
        'title' => $title,
        'content' => $content,
        'tags' => $tags_array
    ];

    if ($post_type === 'event') {
        $context['type'] = $event_type;
        $context['time'] = $event_time;
    }

    // Build extras JSON
    $extras = null;
    if ($buttons && is_array($buttons) && count($buttons) > 0) {
        $extras = $buttons;
    }

    // Insert
    $table = $post_type === 'event' ? 'events' : 'announcements';
    $stmt = $conn->prepare("INSERT INTO $table (groupid, context, extras, created_by) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $group_id,
        json_encode($context),
        $extras ? json_encode($extras) : null,
        $user_id
    ]);

    $new_id = $conn->lastInsertId();

    echo json_encode([
        'status' => 'success',
        'message' => ucfirst($post_type) . ' created successfully',
        'id' => $new_id
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}
