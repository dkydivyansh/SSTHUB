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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'joined_groups') {
        $stmt = $conn->prepare("
            SELECT cg.id, cg.name, cg.description, cg.logo, cg.type, gm.joined_at,
            (
                (SELECT COUNT(*) FROM announcements a WHERE a.groupid = cg.id AND a.id > gm.last_read_announcements) +
                (SELECT COUNT(*) FROM events e WHERE e.groupid = cg.id AND e.id > gm.last_read_events)
            ) as total_unread
            FROM community_groups cg
            JOIN group_members gm ON cg.id = gm.group_id
            WHERE gm.user_id = ?
            ORDER BY gm.joined_at DESC
        ");
        $stmt->execute([$user_id]);
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'data' => $groups
        ]);
        exit();
    }

    if ($action === 'search_groups') {
        $search = trim($_GET['query'] ?? '');
        
        $stmt = $conn->prepare("
            SELECT cg.id, cg.name, cg.description, cg.logo, cg.type,
            EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id = cg.id AND gm.user_id = ?) as is_member
            FROM community_groups cg
            WHERE cg.id = ? OR cg.name LIKE ?
            ORDER BY cg.created_at DESC
            LIMIT 20
        ");
        $stmt->execute([$user_id, $search, '%' . $search . '%']);
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convert boolean correctly
        foreach ($groups as &$group) {
            $group['is_member'] = (bool)$group['is_member'];
        }

        echo json_encode([
            'status' => 'success',
            'data' => $groups
        ]);
        exit();
    }

    if ($action === 'resolve_invite') {
        $code = trim($_GET['code'] ?? '');
        if (!$code) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid invite link']);
            exit();
        }

        $stmt = $conn->prepare("
            SELECT cg.id, cg.name, cg.description, cg.logo, cg.type,
            EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id = cg.id AND gm.user_id = ?) as is_member
            FROM community_groups cg
            JOIN group_invites gi ON cg.id = gi.groupid
            WHERE gi.code = ? AND gi.is_active = TRUE
        ");
        $stmt->execute([$user_id, $code]);
        $group = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($group) {
            $group['is_member'] = (bool)$group['is_member'];
            echo json_encode(['status' => 'success', 'data' => $group]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invite link is invalid or has expired']);
        }
        exit();
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'join_group') {
        $group_id = $data['group_id'] ?? '';

        if (!$group_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Group ID required']);
            exit();
        }

        // Check group existence and privacy
        $stmt = $conn->prepare("SELECT type FROM community_groups WHERE id = ?");
        $stmt->execute([$group_id]);
        $group = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$group) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Group not found']);
            exit();
        }

        if ($group['type'] === 'private') {
            $invite_code = $data['invite_code'] ?? null;
            if (!$invite_code) {
                http_response_code(403);
                echo json_encode(['status' => 'error', 'message' => 'This group is private and requires an invite']);
                exit();
            }

            // Verify invite code
            $stmt = $conn->prepare("SELECT id FROM group_invites WHERE groupid = ? AND code = ? AND is_active = TRUE");
            $stmt->execute([$group_id, $invite_code]);
            if ($stmt->rowCount() === 0) {
                http_response_code(403);
                echo json_encode(['status' => 'error', 'message' => 'Invalid or expired invite link']);
                exit();
            }
        }

        try {
            $stmt = $conn->prepare("INSERT INTO group_members (user_id, group_id) VALUES (?, ?)");
            $stmt->execute([$user_id, $group_id]);
            echo json_encode(['status' => 'success', 'message' => 'Successfully joined group']);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Integrity constraint violation (duplicate entry)
                echo json_encode(['status' => 'error', 'message' => 'You are already a member of this group']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to join group']);
            }
        }
        exit();
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
