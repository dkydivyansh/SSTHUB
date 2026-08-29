<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

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

// Fetch user data to check type
$stmt = $conn->prepare("SELECT type FROM userdata WHERE user_id = :userid");
$stmt->execute([':userid' => $user_id]);
$userData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userData || ($userData['type'] !== 'faculty' && $userData['type'] !== 'admin')) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Admin or Faculty access required']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("
            SELECT c.*,
                   (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id = c.id AND cm.user_id NOT IN (SELECT user_id FROM classadmin ca WHERE ca.class_id = c.id)) as members_count
            FROM classes c
            JOIN classadmin ca ON c.id = ca.class_id
            WHERE ca.user_id = :user_id
            ORDER BY c.name ASC
        ");
        $stmt->execute([':user_id' => $user_id]);
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($classes as &$class) {
            if (isset($class['extras']) && $class['extras']) {
                $class['extras'] = json_decode($class['extras'], true);
            }
        }

        echo json_encode(["status" => "success", "data" => $classes]);
    } catch (PDOException $e) {
        error_log("Faculty classes GET error: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Database error"]);
    }
    exit();
}

echo json_encode(["status" => "error", "message" => "Invalid request method"]);
exit();
?>
