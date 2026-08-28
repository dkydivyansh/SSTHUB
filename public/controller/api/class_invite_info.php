<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

$code = $_GET['code'] ?? null;

if (!$code) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invite code is required']);
    exit();
}

$db = new Database();
$conn = $db->getConnection();

try {
    // Only return public/safe information needed for the invite preview
    $stmt = $conn->prepare("
        SELECT id, name, description, logo 
        FROM classes 
        WHERE invitecode = :code
    ");
    $stmt->execute([':code' => $code]);
    $classData = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($classData) {
        echo json_encode(["status" => "success", "data" => $classData]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Invalid invite code or class not found"]);
    }
} catch (PDOException $e) {
    error_log("Class invite info error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>
