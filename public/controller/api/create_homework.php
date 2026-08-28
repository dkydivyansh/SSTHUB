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
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$class_id = $input['class_id'] ?? null;
$title = $input['title'] ?? null;
$content = $input['content'] ?? null;
$extras = $input['extras'] ?? null;
$expires_at = $input['expires_at'] ?? null;
$status = $input['status'] ?? 'draft';

if (!$class_id || !$title) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit();
}

// Check if user is admin of the class
$stmt = $conn->prepare("SELECT id FROM classadmin WHERE user_id = :user_id AND class_id = :class_id LIMIT 1");
$stmt->execute([':user_id' => $user_id, ':class_id' => $class_id]);
if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Only class admins can create homework']);
    exit();
}

try {
    $extrasJson = $extras ? json_encode($extras) : null;
    
    $stmt = $conn->prepare("
        INSERT INTO homework (class_id, title, content, extras, expires_at, status)
        VALUES (:class_id, :title, :content, :extras, :expires_at, :status)
    ");
    $stmt->execute([
        ':class_id' => $class_id,
        ':title' => $title,
        ':content' => $content,
        ':extras' => $extrasJson,
        ':expires_at' => $expires_at,
        ':status' => $status
    ]);

    $homework_id = $conn->lastInsertId();

    echo json_encode(['status' => 'success', 'data' => ['id' => $homework_id]]);
} catch (PDOException $e) {
    error_log("Create homework error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
exit();
?>
