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
        SELECT cg.id, cg.name, cg.description, cg.logo, cg.type, cg.created_at, ga.userids
        FROM community_groups cg
        LEFT JOIN groupadmin ga ON cg.id = ga.groupid
        WHERE 1=1
    ";
    
    $params = [];

    if ($search !== '') {
        $query .= " AND cg.name LIKE ?";
        $params[] = '%' . $search . '%';
    }

    $query .= " ORDER BY cg.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Parse JSON userids
    foreach ($groups as &$group) {
        if ($group['userids']) {
            $group['admins'] = json_decode($group['userids'], true);
        } else {
            $group['admins'] = [];
        }
        unset($group['userids']);
    }

    echo json_encode([
        'status' => 'success',
        'data' => $groups
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
        $type = in_array($data['type'] ?? '', ['public', 'private']) ? $data['type'] : 'public';
        $admins = $data['admins'] ?? []; // Array of IDs

        if (!$name) {
            echo json_encode(['status' => 'error', 'message' => 'Group name is required']);
            exit();
        }

        // Generate ID
        $groupid = bin2hex(random_bytes(4));

        try {
            $conn->beginTransaction();

            $stmt = $conn->prepare("INSERT INTO community_groups (id, name, description, logo, type) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$groupid, $name, $description, $logo, $type]);

            $adminStmt = $conn->prepare("INSERT INTO groupadmin (groupid, userids) VALUES (?, ?)");
            $adminStmt->execute([$groupid, json_encode($admins)]);

            $conn->commit();

            echo json_encode(['status' => 'success', 'message' => 'Group created successfully']);
        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to create group']);
        }
        exit();
    }

    if ($data['action'] === 'delete') {
        $target_id = $data['id'] ?? '';
        if (!$target_id) {
            echo json_encode(['status' => 'error', 'message' => 'Group ID is required']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM community_groups WHERE id = ?");
        if ($stmt->execute([$target_id])) {
            echo json_encode(['status' => 'success', 'message' => 'Group deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete group']);
        }
        exit();
    }

    if ($data['action'] === 'update_admins') {
        $target_id = $data['id'] ?? '';
        $admins = $data['admins'] ?? [];

        if (!$target_id) {
            echo json_encode(['status' => 'error', 'message' => 'Group ID is required']);
            exit();
        }

        // Ensure groupadmin record exists
        $check = $conn->prepare("SELECT id FROM groupadmin WHERE groupid = ?");
        $check->execute([$target_id]);
        
        if ($check->rowCount() > 0) {
            $stmt = $conn->prepare("UPDATE groupadmin SET userids = ? WHERE groupid = ?");
            $stmt->execute([json_encode($admins), $target_id]);
        } else {
            $stmt = $conn->prepare("INSERT INTO groupadmin (groupid, userids) VALUES (?, ?)");
            $stmt->execute([$target_id, json_encode($admins)]);
        }

        echo json_encode(['status' => 'success', 'message' => 'Admins updated successfully']);
        exit();
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
