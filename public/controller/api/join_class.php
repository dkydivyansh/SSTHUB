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

$data = json_decode(file_get_contents('php://input'), true);
$invitecode = $data['invitecode'] ?? null;

if (!$invitecode) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invite code is required']);
    exit();
}

try {
    // 1. Validate the invite code and get the class ID
    $stmt = $conn->prepare("SELECT id FROM classes WHERE invitecode = :code");
    $stmt->execute([':code' => $invitecode]);
    $class = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$class) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Invalid invite code or class not found"]);
        exit();
    }

    $class_id = $class['id'];

    // 2. Insert into class_members (ignores if already a member thanks to UNIQUE constraint)
    // By using INSERT IGNORE (MySQL/MariaDB) or catching duplicate entry
    try {
        $stmt = $conn->prepare("
            INSERT INTO class_members (user_id, class_id) 
            VALUES (:user_id, :class_id)
        ");
        $stmt->execute([
            ':user_id' => $user_id,
            ':class_id' => $class_id
        ]);
        echo json_encode(["status" => "success", "message" => "Successfully joined the class!"]);
    } catch (PDOException $e) {
        // If it's a duplicate entry error (Integrity constraint violation), we can just return success 
        // since they are already in the class.
        if ($e->getCode() == 23000) {
            echo json_encode(["status" => "success", "message" => "You are already a member of this class."]);
        } else {
            throw $e;
        }
    }
} catch (PDOException $e) {
    error_log("Join class error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>
