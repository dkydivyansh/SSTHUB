<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user_id = $_COOKIE['user_id'] ?? null;
$session_id = $_COOKIE['session_id'] ?? null;

if (!$user_id || !$session_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Missing session cookies']);
    exit();
}

$db = new Database();
$conn = $db->getConnection();
$sessionManager = new SessionManager($conn);

$status = $sessionManager->validateSessionStatus($user_id, $session_id);
if ($status === 'invalid_session' || $status === 'disabled') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid or disabled session']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$class_id = $input['class_id'] ?? null;
$name = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');

if (!$class_id || empty($name)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Class ID and Name are required']);
    exit();
}

try {
    // Check if user is admin or faculty for this class
    $stmt = $conn->prepare("
        SELECT 1 FROM classadmin WHERE class_id = :class_id AND user_id = :user_id
        UNION
        SELECT 1 FROM userdata WHERE user_id = :user_id AND type = 'admin'
    ");
    $stmt->execute([':class_id' => $class_id, ':user_id' => $user_id]);
    
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden: You do not have permission to edit this class']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE classes SET name = :name, description = :description WHERE id = :id");
    $stmt->execute([
        ':name' => $name,
        ':description' => $description,
        ':id' => $class_id
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Class updated successfully']);
} catch (PDOException $e) {
    error_log("Update class error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
