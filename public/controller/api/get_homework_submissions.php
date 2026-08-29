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

$class_id = $_GET['class_id'] ?? null;
$homework_id = $_GET['homework_id'] ?? null;

if (!$class_id || !$homework_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing class_id or homework_id']);
    exit();
}

try {
    // Check if user is admin/faculty of this class
    $stmt = $conn->prepare("
        SELECT 1 FROM classadmin WHERE class_id = :class_id AND user_id = :user_id
        UNION
        SELECT 1 FROM userdata WHERE user_id = :user_id AND type = 'admin'
    ");
    $stmt->execute([':class_id' => $class_id, ':user_id' => $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit();
    }

    // Fetch homework details
    $stmt = $conn->prepare("SELECT id, title, status, extras FROM homework WHERE id = :homework_id AND class_id = :class_id");
    $stmt->execute([':homework_id' => $homework_id, ':class_id' => $class_id]);
    $homework = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$homework) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Homework not found']);
        exit();
    }
    $homework['extras'] = $homework['extras'] ? json_decode($homework['extras'], true) : null;

    // Fetch all enrolled students and their submissions
    $sql = "
        SELECT u.id, u.email, ud.name, ud.rollno, ud.avatar,
               s.id as submission_id, s.submission, s.created_at as submitted_at,
               CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as is_submitted
        FROM class_members cm
        JOIN users u ON cm.user_id = u.id
        JOIN userdata ud ON u.id = ud.user_id
        LEFT JOIN homework_submissions s ON cm.user_id = s.user_id AND s.homework_id = :homework_id
        WHERE cm.class_id = :class_id
        AND cm.user_id NOT IN (SELECT user_id FROM classadmin WHERE class_id = :class_id)
        ORDER BY is_submitted DESC, ud.name ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':class_id' => $class_id, ':homework_id' => $homework_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $total_students = count($students);
    $total_submitted = 0;

    foreach ($students as &$student) {
        if ($student['is_submitted']) {
            $total_submitted++;
        }
        $student['submission'] = $student['submission'] ? json_decode($student['submission'], true) : null;
    }

    echo json_encode([
        'status' => 'success',
        'homework' => $homework,
        'stats' => [
            'total_students' => $total_students,
            'total_submitted' => $total_submitted
        ],
        'students' => $students
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
