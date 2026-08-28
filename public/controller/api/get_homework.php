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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$class_id = $_GET['class_id'] ?? null;
$homework_id = $_GET['homework_id'] ?? null; 

if (!$class_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'class_id is required']);
    exit();
}

// Check user role
$is_admin = false;
$stmt = $conn->prepare("SELECT 1 FROM classadmin WHERE user_id = :uid AND class_id = :cid");
$stmt->execute([':uid' => $user_id, ':cid' => $class_id]);
if ($stmt->fetch(PDO::FETCH_ASSOC)) {
    $is_admin = true;
} else {
    $stmt = $conn->prepare("SELECT 1 FROM class_members WHERE user_id = :uid AND class_id = :cid");
    $stmt->execute([':uid' => $user_id, ':cid' => $class_id]);
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden: Not a member of this class']);
        exit();
    }
}

try {
    if ($homework_id) {
        $sql = "
            SELECT h.*, s.submission as user_submission, s.created_at as submitted_at
            FROM homework h
            LEFT JOIN homework_submissions s ON h.id = s.homework_id AND s.user_id = :user_id
            WHERE h.class_id = :class_id AND h.id = :homework_id
        ";
        if (!$is_admin) {
            $sql .= " AND h.status = 'published'";
        }

        $stmt = $conn->prepare($sql);
        $stmt->execute([':class_id' => $class_id, ':homework_id' => $homework_id, ':user_id' => $user_id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($data) {
            $data['extras'] = $data['extras'] ? json_decode($data['extras'], true) : null;
            $data['user_submission'] = $data['user_submission'] ? json_decode($data['user_submission'], true) : null;
        } else {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Homework not found']);
            exit();
        }
    } else {
        $sql = "
            SELECT h.*, 
                   CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as is_submitted
            FROM homework h
            LEFT JOIN homework_submissions s ON h.id = s.homework_id AND s.user_id = :user_id
            WHERE h.class_id = :class_id
        ";
        if (!$is_admin) {
            $sql .= " AND h.status = 'published'";
        }
        $sql .= " ORDER BY h.created_at DESC";

        $stmt = $conn->prepare($sql);
        $stmt->execute([':class_id' => $class_id, ':user_id' => $user_id]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($data as &$row) {
            $row['extras'] = $row['extras'] ? json_decode($row['extras'], true) : null;
        }
    }

    echo json_encode(['status' => 'success', 'data' => $data]);
} catch (PDOException $e) {
    error_log("Get homework error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
exit();
?>
