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

    $query = "
        SELECT c.id, c.name, c.invitecode, c.description, c.logo, c.created_at, 
               GROUP_CONCAT(ca.user_id) as admins_list
        FROM classes c
        LEFT JOIN classadmin ca ON c.id = ca.class_id
        WHERE 1=1
    ";
    
    $params = [];

    if ($search !== '') {
        $query .= " AND c.name LIKE ?";
        $params[] = '%' . $search . '%';
    }

    $query .= " GROUP BY c.id ORDER BY c.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($classes as &$class) {
        if ($class['admins_list']) {
            $class['admins'] = array_map('intval', explode(',', $class['admins_list']));
        } else {
            $class['admins'] = [];
        }
        unset($class['admins_list']);
    }

    echo json_encode([
        'status' => 'success',
        'data' => $classes
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['action'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        exit();
    }

    if ($data['action'] === 'create') {
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $logo = trim($data['logo'] ?? '');
        $admins = $data['admins'] ?? []; // Array of IDs

        if (!$name) {
            echo json_encode(['status' => 'error', 'message' => 'Class name is required']);
            exit();
        }

        // Generate Class ID
        $class_id = bin2hex(random_bytes(4));
        
        // Generate Invite Code (16 digit numeric)
        $invitecode = '';
        for ($i = 0; $i < 16; $i++) {
            $invitecode .= mt_rand(0, 9);
        }

        try {
            $conn->beginTransaction();

            $stmt = $conn->prepare("INSERT INTO classes (id, name, invitecode, description, logo) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$class_id, $name, $invitecode, $description, $logo]);

            if (!empty($admins)) {
                $adminStmt = $conn->prepare("INSERT INTO classadmin (user_id, class_id) VALUES (?, ?)");
                $memberStmt = $conn->prepare("INSERT IGNORE INTO class_members (user_id, class_id) VALUES (?, ?)");
                foreach ($admins as $admin_id) {
                    $adminStmt->execute([$admin_id, $class_id]);
                    $memberStmt->execute([$admin_id, $class_id]);
                }
            }

            $conn->commit();

            echo json_encode(['status' => 'success', 'message' => 'Class created successfully']);
        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to create class', 'details' => $e->getMessage()]);
        }
        exit();
    }

    if ($data['action'] === 'delete') {
        $target_id = $data['id'] ?? '';
        if (!$target_id) {
            echo json_encode(['status' => 'error', 'message' => 'Class ID is required']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM classes WHERE id = ?");
        if ($stmt->execute([$target_id])) {
            echo json_encode(['status' => 'success', 'message' => 'Class deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete class']);
        }
        exit();
    }

    if ($data['action'] === 'update_admins') {
        $target_id = $data['id'] ?? '';
        $admins = $data['admins'] ?? [];

        if (!$target_id) {
            echo json_encode(['status' => 'error', 'message' => 'Class ID is required']);
            exit();
        }

        try {
            $conn->beginTransaction();

            // Delete existing admins
            $delStmt = $conn->prepare("DELETE FROM classadmin WHERE class_id = ?");
            $delStmt->execute([$target_id]);

            // Insert new admins
            if (!empty($admins)) {
                $insStmt = $conn->prepare("INSERT INTO classadmin (user_id, class_id) VALUES (?, ?)");
                $memberStmt = $conn->prepare("INSERT IGNORE INTO class_members (user_id, class_id) VALUES (?, ?)");
                foreach ($admins as $admin_id) {
                    $insStmt->execute([$admin_id, $target_id]);
                    $memberStmt->execute([$admin_id, $target_id]);
                }
            }

            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Admins updated successfully']);
        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to update admins', 'details' => $e->getMessage()]);
        }
        exit();
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
