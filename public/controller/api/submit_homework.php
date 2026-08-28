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
$homework_id = $input['homework_id'] ?? null;
$submission = $input['submission'] ?? null;

if (!$class_id || !$homework_id || !$submission) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit();
}

// Ensure the user is a member of the class (not just admin)
$stmt = $conn->prepare("SELECT 1 FROM class_members WHERE user_id = :uid AND class_id = :cid");
$stmt->execute([':uid' => $user_id, ':cid' => $class_id]);
if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Only class members can submit homework']);
    exit();
}

// Fetch homework and check deadline
$stmt = $conn->prepare("SELECT expires_at FROM homework WHERE id = :hid AND class_id = :cid");
$stmt->execute([':hid' => $homework_id, ':cid' => $class_id]);
$homework = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$homework) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Homework not found']);
    exit();
}

if ($homework['expires_at']) {
    $expires_at = strtotime($homework['expires_at']);
    if (time() > $expires_at) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Deadline has passed for this homework']);
        exit();
    }
}

try {
    $submissionJson = json_encode($submission);
    
    // Insert or update (if already exists, overwrite it)
    $stmt = $conn->prepare("
        INSERT INTO homework_submissions (user_id, class_id, homework_id, submission)
        VALUES (:user_id, :class_id, :homework_id, :submission)
        ON DUPLICATE KEY UPDATE submission = :submission, created_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([
        ':user_id' => $user_id,
        ':class_id' => $class_id,
        ':homework_id' => $homework_id,
        ':submission' => $submissionJson
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Homework submitted successfully']);
} catch (PDOException $e) {
    error_log("Submit homework error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
exit();
?>
