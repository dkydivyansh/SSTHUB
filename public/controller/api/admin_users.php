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

// Check admin role
$roleStmt = $conn->prepare("SELECT type FROM userdata WHERE user_id = ? LIMIT 1");
$roleStmt->execute([$user_id]);
$currentUser = $roleStmt->fetch(PDO::FETCH_ASSOC);

if (!$currentUser || $currentUser['type'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Admin access required']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $search = $_GET['search'] ?? '';
    $filterStatus = $_GET['status'] ?? '';
    $filterType = $_GET['type'] ?? '';

    $query = "
        SELECT u.id as userid, u.email, ud.name, ud.rollno, ud.batch, ud.avatar, ud.type, ud.status, ud.disabledmsg 
        FROM users u 
        JOIN userdata ud ON u.id = ud.user_id 
        WHERE 1=1
    ";
    
    $params = [];

    if ($search !== '') {
        $query .= " AND (ud.name LIKE ? OR ud.rollno LIKE ? OR u.email LIKE ?)";
        $searchTerm = '%' . $search . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    if ($filterStatus !== '') {
        $query .= " AND ud.status = ?";
        $params[] = $filterStatus;
    }

    if ($filterType !== '') {
        $query .= " AND ud.type = ?";
        $params[] = $filterType;
    }

    $query .= " ORDER BY u.id DESC LIMIT 100";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $users
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($data['action'] === 'update_status') {
        $target_user_id = $data['target_user_id'] ?? null;
        $new_status = $data['status'] ?? null;
        $disabledmsg = $data['disabledmsg'] ?? null;

        if (!$target_user_id || !in_array($new_status, ['active', 'pending', 'disabled'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid user ID or status']);
            exit();
        }

        // Prepare update
        if ($new_status === 'disabled') {
            $stmt = $conn->prepare("UPDATE userdata SET status = ?, disabledmsg = ? WHERE user_id = ?");
            $success = $stmt->execute([$new_status, $disabledmsg, $target_user_id]);
        } else {
            $stmt = $conn->prepare("UPDATE userdata SET status = ?, disabledmsg = NULL WHERE user_id = ?");
            $success = $stmt->execute([$new_status, $target_user_id]);
        }

        if ($success) {
            echo json_encode(['status' => 'success', 'message' => 'User status updated']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to update user']);
        }
        exit();
    }

    if ($data['action'] === 'update_role') {
        $target_user_id = $data['target_user_id'] ?? null;
        $new_role = $data['role'] ?? null;

        if (!$target_user_id || !in_array($new_role, ['member', 'faculty'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid user ID or role']);
            exit();
        }

        // Prevent modifying another admin's role
        $stmt = $conn->prepare("SELECT type FROM userdata WHERE user_id = ?");
        $stmt->execute([$target_user_id]);
        $target_user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$target_user) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
            exit();
        }

        if ($target_user['type'] === 'admin') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Cannot modify admin roles']);
            exit();
        }

        $stmt = $conn->prepare("UPDATE userdata SET type = ? WHERE user_id = ?");
        $success = $stmt->execute([$new_role, $target_user_id]);

        if ($success) {
            echo json_encode(['status' => 'success', 'message' => 'User role updated']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to update user role']);
        }
        exit();
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
