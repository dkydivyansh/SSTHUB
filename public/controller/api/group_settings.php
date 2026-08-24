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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $group_id = $data['group_id'] ?? null;
    $action = $data['action'] ?? null;

    if (!$group_id || !$action) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing group_id or action']);
        exit();
    }

    // Verify group admin status
    $stmt = $conn->prepare("SELECT userids FROM groupadmin WHERE groupid = ?");
    $stmt->execute([$group_id]);
    $admin_row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $is_admin = false;
    if ($admin_row && $admin_row['userids']) {
        $admin_ids = json_decode($admin_row['userids'], true);
        if (is_array($admin_ids) && in_array($user_id, $admin_ids)) {
            $is_admin = true;
        }
    }

    if (!$is_admin) {
        // Also check if user is a system admin, they can always bypass
        $roleStmt = $conn->prepare("SELECT type FROM userdata WHERE user_id = ? LIMIT 1");
        $roleStmt->execute([$user_id]);
        $sysUser = $roleStmt->fetch(PDO::FETCH_ASSOC);
        if ($sysUser && $sysUser['type'] === 'admin') {
            $is_admin = true;
        }
    }

    if (!$is_admin) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden: Group admin access required']);
        exit();
    }

    if ($action === 'update_group_details') {
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $logo = trim($data['logo'] ?? '');
        $type = in_array($data['type'] ?? '', ['public', 'private']) ? $data['type'] : 'public';

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Group name is required']);
            exit();
        }

        if ($logo && !preg_match('/^https?:\/\//i', $logo) && strpos($logo, '/api/group_attachment_get') === false) {
            $logo = '/api/group_attachment_get?id=' . $logo;
        }

        try {
            // Check old logo
            $oldStmt = $conn->prepare("SELECT logo FROM community_groups WHERE id = ?");
            $oldStmt->execute([$group_id]);
            $oldRow = $oldStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($oldRow && $oldRow['logo'] && $oldRow['logo'] !== $logo) {
                $oldLogo = $oldRow['logo'];
                // Detect if it's an uploaded attachment
                if (preg_match('/^\/api\/group_attachment_get\?id=([a-zA-Z0-9-]+)$/i', $oldLogo, $matches)) {
                    $oldUuid = $matches[1];
                    $oldPath = __DIR__ . '/../../../storage/uploads/grp_' . $oldUuid . '.bin';
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                    $delStmt = $conn->prepare("DELETE FROM group_attachments WHERE id = ?");
                    $delStmt->execute([$oldUuid]);
                }
            }

            $stmt = $conn->prepare("UPDATE community_groups SET name = ?, description = ?, logo = ?, type = ? WHERE id = ?");
            $stmt->execute([$name, $description, $logo, $type, $group_id]);
            echo json_encode(['status' => 'success', 'message' => 'Group details updated']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
        exit();
    }

    if ($action === 'add_custom_page') {
        $title = trim($data['title'] ?? '');
        $url = trim($data['url'] ?? '');

        if (empty($title) || empty($url)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Title and URL are required']);
            exit();
        }

        try {
            $conn->beginTransaction();
            
            // Get current custom pages
            $stmt = $conn->prepare("SELECT custom_pages FROM community_groups WHERE id = ? FOR UPDATE");
            $stmt->execute([$group_id]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$group) {
                $conn->rollBack();
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Group not found']);
                exit();
            }

            $custom_pages = [];
            if ($group['custom_pages']) {
                $custom_pages = json_decode($group['custom_pages'], true);
                if (!is_array($custom_pages)) $custom_pages = [];
            }

            $custom_pages[] = [
                'title' => $title,
                'url' => $url,
                'added_at' => date('Y-m-d H:i:s')
            ];

            $stmt = $conn->prepare("UPDATE community_groups SET custom_pages = ? WHERE id = ?");
            $stmt->execute([json_encode($custom_pages), $group_id]);

            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Custom page added successfully', 'custom_pages' => $custom_pages]);
            exit();
        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
            exit();
        }
    }

    if ($action === 'delete_custom_page') {
        $index = $data['index'] ?? -1;
        
        if ($index < 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid page index']);
            exit();
        }

        try {
            $conn->beginTransaction();
            
            $stmt = $conn->prepare("SELECT custom_pages FROM community_groups WHERE id = ? FOR UPDATE");
            $stmt->execute([$group_id]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($group && $group['custom_pages']) {
                $custom_pages = json_decode($group['custom_pages'], true);
                if (is_array($custom_pages) && isset($custom_pages[$index])) {
                    array_splice($custom_pages, $index, 1); // Remove the item
                    $stmt = $conn->prepare("UPDATE community_groups SET custom_pages = ? WHERE id = ?");
                    $stmt->execute([json_encode($custom_pages), $group_id]);
                }
            }
            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Custom page removed', 'custom_pages' => $custom_pages ?? []]);
            exit();
        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
            exit();
        }
    }

    if ($action === 'get_invite') {
        $stmt = $conn->prepare("SELECT code FROM group_invites WHERE groupid = ? AND is_active = TRUE");
        $stmt->execute([$group_id]);
        $invite = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'invite_code' => $invite ? $invite['code'] : null]);
        exit();
    }

    if ($action === 'create_invite' || $action === 'reset_invite') {
        // Generate a 12-char alphanumeric code
        $code = bin2hex(random_bytes(6));
        try {
            $stmt = $conn->prepare("INSERT INTO group_invites (groupid, code, is_active) VALUES (?, ?, TRUE) ON DUPLICATE KEY UPDATE code = ?, is_active = TRUE");
            $stmt->execute([$group_id, $code, $code]);
            echo json_encode(['status' => 'success', 'message' => 'Invite link generated', 'invite_code' => $code]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to generate invite', 'error' => $e->getMessage()]);
        }
        exit();
    }

    if ($action === 'delete_invite') {
        try {
            $stmt = $conn->prepare("UPDATE group_invites SET is_active = FALSE WHERE groupid = ?");
            $stmt->execute([$group_id]);
            echo json_encode(['status' => 'success', 'message' => 'Invite link deleted']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete invite']);
        }
        exit();
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
