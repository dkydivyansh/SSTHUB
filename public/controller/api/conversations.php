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
if ($status === 'invalid_session') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid session']);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Helper function to check if user is in a conversation
function isParticipant($conn, $conversation_id, $user_id) {
    $stmt = $conn->prepare("SELECT 1 FROM participants WHERE conversation_id = ? AND user_id = ?");
    $stmt->execute([$conversation_id, $user_id]);
    return $stmt->fetchColumn() !== false;
}

// POST /api/conversations : Create a new conversation
if ($request_uri === '/api/conversations' && $request_method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $other_user_rollno = $input['other_user_rollno'] ?? null;

    if (!$other_user_rollno) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing other_user_rollno']);
        exit();
    }

    // Lookup user_id for the given rollno
    $stmt = $conn->prepare("SELECT user_id FROM userdata WHERE rollno = ?");
    $stmt->execute([$other_user_rollno]);
    $other_user_id = $stmt->fetchColumn();

    if (!$other_user_id || $other_user_id == $user_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid other_user_rollno']);
        exit();
    }

    try {
        // 1. Check if a direct message conversation already exists between these two users
        $stmt = $conn->prepare("
            SELECT p1.conversation_id 
            FROM participants p1
            JOIN participants p2 ON p1.conversation_id = p2.conversation_id
            JOIN conversations c ON p1.conversation_id = c.id
            WHERE p1.user_id = ? AND p2.user_id = ? AND c.type = 'direct_message'
            LIMIT 1
        ");
        $stmt->execute([$user_id, $other_user_id]);
        $existing = $stmt->fetchColumn();

        if ($existing) {
            echo json_encode(['status' => 'success', 'data' => ['state' => 'exist', 'conversation_id' => $existing]]);
            exit();
        }

        // 2. Check if there is an existing chat request
        $stmt = $conn->prepare("
            SELECT from_user_id, status 
            FROM chat_requests 
            WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
            LIMIT 1
        ");
        $stmt->execute([$user_id, $other_user_id, $other_user_id, $user_id]);
        $request = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($request) {
            // Note: If status is 'ignored', we still want to block sending another request.
            if ($request['from_user_id'] == $user_id) {
                echo json_encode(['status' => 'success', 'data' => ['state' => 'already_requested']]);
            } else {
                echo json_encode(['status' => 'success', 'data' => ['state' => 'received_request']]);
            }
            exit();
        }

        // 3. Nothing exists, request required
        echo json_encode(['status' => 'success', 'data' => ['state' => 'request_required']]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
    exit();
}

// Routes with {id}
if (preg_match('#^/api/conversations/(\d+)/messages$#', $request_uri, $matches)) {
    $conversation_id = (int)$matches[1];

    if (!isParticipant($conn, $conversation_id, $user_id)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit();
    }

    if ($request_method === 'GET') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        // Max limit 100
        $limit = min($limit, 100);

        try {
            $stmt = $conn->prepare("
                SELECT 
                    m.id AS message_id,
                    m.content,
                    m.created_at,
                    u.id AS sender_id,
                    ud.name AS sender_name,
                    ud.avatar AS sender_avatar
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                LEFT JOIN userdata ud ON u.id = ud.user_id
                WHERE m.conversation_id = ? 
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            ");
            
            // Using bindValue for LIMIT and OFFSET
            $stmt->bindValue(1, $conversation_id, PDO::PARAM_INT);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->bindValue(3, $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['status' => 'success', 'data' => $messages]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
        exit();
    }

    if ($request_method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $content = trim($input['content'] ?? '');
        $media = $input['media'] ?? [];
        $reply_to = $input['reply_to'] ?? null;
        if (!is_array($media)) {
            $media = [];
        }

        if (count($media) > 10) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Maximum 10 media attachments allowed']);
            exit();
        }

        foreach ($media as $item) {
            if (!isset($item['type'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid media format']);
                exit();
            }
            
            if ($item['type'] === 'image' && isset($item['data'])) {
                if (strlen($item['data']) > 3145728) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Base64 image size exceeds 2MB limit']);
                    exit();
                }
            } elseif ($item['type'] === 'attachment' && isset($item['uuid'])) {
                // Valid attachment reference
            } else {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid media format']);
                exit();
            }
        }

        if (empty($content) && empty($media)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Message content or media is required']);
            exit();
        }

        $payload = ['text' => $content];
        if (!empty($media)) {
            $payload['media'] = $media;
        }
        if (!empty($reply_to) && is_array($reply_to)) {
            $payload['reply_to'] = $reply_to;
        }
        $jsonContent = json_encode($payload);

        try {
            $stmt = $conn->prepare("INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)");
            $stmt->execute([$conversation_id, $user_id, $jsonContent]);
            
            $message_id = $conn->lastInsertId();
            echo json_encode(['status' => 'success', 'data' => ['message_id' => $message_id]]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
        exit();
    }
}

// Routes with {id}/archive
if (preg_match('#^/api/conversations/(\d+)/archive$#', $request_uri, $matches) && $request_method === 'POST') {
    $conversation_id = (int)$matches[1];

    if (!isParticipant($conn, $conversation_id, $user_id)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $archive_state = isset($input['archive']) && $input['archive'] ? 1 : 0;

    try {
        $stmt = $conn->prepare("UPDATE participants SET is_archived = ? WHERE conversation_id = ? AND user_id = ?");
        $stmt->execute([$archive_state, $conversation_id, $user_id]);
        
        echo json_encode(['status' => 'success', 'message' => $archive_state ? 'Archived' : 'Unarchived']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
    exit();
}

// Routes with {id}/seen
if (preg_match('#^/api/conversations/(\d+)/seen$#', $request_uri, $matches) && $request_method === 'POST') {
    $conversation_id = (int)$matches[1];

    if (!isParticipant($conn, $conversation_id, $user_id)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $message_id = isset($input['message_id']) ? (int)$input['message_id'] : null;

    if ($message_id) {
        try {
            $stmt = $conn->prepare("UPDATE participants SET last_seen_message_id = ? WHERE conversation_id = ? AND user_id = ? AND (last_seen_message_id IS NULL OR last_seen_message_id < ?)");
            $stmt->execute([$message_id, $conversation_id, $user_id, $message_id]);
            echo json_encode(['status' => 'success']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing message_id']);
    }
    exit();
}

// DELETE /api/conversations/{id}/messages/{message_id}
if (preg_match('#^/api/conversations/(\d+)/messages/(\d+)$#', $request_uri, $matches) && $request_method === 'DELETE') {
    $conversation_id = (int)$matches[1];
    $message_id = (int)$matches[2];

    if (!isParticipant($conn, $conversation_id, $user_id)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit();
    }

    try {
        // First check if the message belongs to the user
        $stmt = $conn->prepare("SELECT sender_id, content FROM messages WHERE id = ? AND conversation_id = ?");
        $stmt->execute([$message_id, $conversation_id]);
        $msgRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$msgRow) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Message not found']);
            exit();
        }

        if ($msgRow['sender_id'] != $user_id) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'You can only delete your own messages']);
            exit();
        }

        // Clean up any attachments linked in the content
        if ($msgRow['content'] && !str_starts_with($msgRow['content'], 'B64:')) {
            $parsed = json_decode($msgRow['content'], true);
            if ($parsed && isset($parsed['media']) && is_array($parsed['media'])) {
                foreach ($parsed['media'] as $mediaItem) {
                    if (isset($mediaItem['type']) && $mediaItem['type'] === 'attachment' && isset($mediaItem['uuid'])) {
                        $uuid = $mediaItem['uuid'];
                        // Delete physical file
                        $filePath = __DIR__ . '/../../../storage/uploads/' . $uuid . '.bin';
                        if (file_exists($filePath)) {
                            unlink($filePath);
                        }
                        // Delete DB record
                        $stmtDel = $conn->prepare("DELETE FROM attachments WHERE id = ?");
                        $stmtDel->execute([$uuid]);
                    }
                }
            }
        }

        $deletedContent = json_encode(['status' => 'deleted']);
        $stmt = $conn->prepare("UPDATE messages SET content = ? WHERE id = ?");
        $stmt->execute([$deletedContent, $message_id]);

        echo json_encode(['status' => 'success']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error', 'debug' => $e->getMessage()]);
    }
    exit();
}

// POST /api/conversations/{id}/messages/{message_id}/reactions
if (preg_match('#^/api/conversations/(\d+)/messages/(\d+)/reactions$#', $request_uri, $matches) && $request_method === 'POST') {
    $conversation_id = (int)$matches[1];
    $message_id = (int)$matches[2];

    if (!isParticipant($conn, $conversation_id, $user_id)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $reaction = $input['reaction'] ?? null;

    if (!$reaction) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Reaction emoji required']);
        exit();
    }

    try {
        $stmt = $conn->prepare("SELECT content FROM messages WHERE id = ? AND conversation_id = ?");
        $stmt->execute([$message_id, $conversation_id]);
        $contentStr = $stmt->fetchColumn();

        if ($contentStr === false) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Message not found']);
            exit();
        }

        if (str_starts_with($contentStr, 'B64:')) {
            $parsed = ['text' => '', 'media' => [['data' => $contentStr, 'type' => 'image']]];
        } else {
            $parsed = json_decode($contentStr, true);
        }

        if (!isset($parsed['reactions']) || !is_array($parsed['reactions'])) {
            $parsed['reactions'] = [];
        }

        $reactions = $parsed['reactions'];
        $wasInSameReaction = false;

        foreach ($reactions as $emoji => $users) {
            $userIndex = array_search($user_id, $users);
            if ($userIndex !== false) {
                if ($emoji === $reaction) {
                    $wasInSameReaction = true;
                }
                array_splice($reactions[$emoji], $userIndex, 1);
            }
            if (empty($reactions[$emoji])) {
                unset($reactions[$emoji]);
            }
        }

        if (!$wasInSameReaction) {
            if (!isset($reactions[$reaction])) {
                $reactions[$reaction] = [];
            }
            $reactions[$reaction][] = $user_id;
        }

        $parsed['reactions'] = $reactions;
        $updatedContent = json_encode($parsed);

        $stmt = $conn->prepare("UPDATE messages SET content = ? WHERE id = ?");
        $stmt->execute([$updatedContent, $message_id]);

        echo json_encode(['status' => 'success', 'reactions' => $reactions]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
    exit();
}

// Fallback
http_response_code(404);
echo json_encode(['status' => 'error', 'message' => 'Route not found or invalid method']);
?>
