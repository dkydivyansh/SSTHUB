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

// POST /api/chat_requests - Send a new request
if ($request_uri === '/api/chat_requests' && $request_method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $other_user_rollno = $input['other_user_rollno'] ?? null;
    $message = trim($input['message'] ?? '');

    if (!$other_user_rollno) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing other_user_rollno']);
        exit();
    }

    // Limit message length
    if (strlen($message) > 500) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Message exceeds 500 characters']);
        exit();
    }

    $stmt = $conn->prepare("SELECT user_id FROM userdata WHERE rollno = ?");
    $stmt->execute([$other_user_rollno]);
    $other_user_id = $stmt->fetchColumn();

    if (!$other_user_id || $other_user_id == $user_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid other_user_rollno']);
        exit();
    }

    try {
        // Check if existing chat
        $stmt = $conn->prepare("
            SELECT p1.conversation_id 
            FROM participants p1
            JOIN participants p2 ON p1.conversation_id = p2.conversation_id
            JOIN conversations c ON p1.conversation_id = c.id
            WHERE p1.user_id = ? AND p2.user_id = ? AND c.type = 'direct_message'
            LIMIT 1
        ");
        $stmt->execute([$user_id, $other_user_id]);
        if ($stmt->fetchColumn()) {
            echo json_encode(['status' => 'error', 'message' => 'Conversation already exists']);
            exit();
        }

        // Store message as JSON
        $jsonMessage = json_encode(['text' => $message]);

        // Insert or ignore if duplicate request exists
        $stmt = $conn->prepare("INSERT INTO chat_requests (from_user_id, to_user_id, message) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $other_user_id, $jsonMessage]);

        echo json_encode(['status' => 'success', 'message' => 'Request sent']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Integrity constraint violation (UNIQUE KEY)
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Request already exists']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error']);
        }
    }
    exit();
}

// GET /api/chat_requests - Fetch my requests
if ($request_uri === '/api/chat_requests' && $request_method === 'GET') {
    $type = $_GET['type'] ?? 'received'; // 'sent' or 'received'

    try {
        if ($type === 'sent') {
            $stmt = $conn->prepare("
                SELECT 
                    cr.id, 
                    cr.message, 
                    cr.created_at, 
                    cr.status,
                    ud.name, 
                    ud.avatar, 
                    ud.rollno
                FROM chat_requests cr
                JOIN userdata ud ON cr.to_user_id = ud.user_id
                WHERE cr.from_user_id = ?
                ORDER BY cr.created_at DESC
            ");
        } else {
            $stmt = $conn->prepare("
                SELECT 
                    cr.id, 
                    cr.message, 
                    cr.created_at, 
                    cr.status,
                    ud.name, 
                    ud.avatar, 
                    ud.rollno
                FROM chat_requests cr
                JOIN userdata ud ON cr.from_user_id = ud.user_id
                WHERE cr.to_user_id = ?
                ORDER BY cr.created_at DESC
            ");
        }
        $stmt->execute([$user_id]);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $requests]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
    exit();
}

// Routes with {id}
if (preg_match('#^/api/chat_requests/(\d+)/(accept|ignore)$#', $request_uri, $matches) && $request_method === 'POST') {
    $request_id = (int)$matches[1];
    $action = $matches[2];

    try {
        // Fetch request details
        $stmt = $conn->prepare("SELECT from_user_id, message FROM chat_requests WHERE id = ? AND to_user_id = ? AND status = 'pending' LIMIT 1");
        $stmt->execute([$request_id, $user_id]);
        $reqData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$reqData) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Request not found or already processed']);
            exit();
        }

        if ($action === 'ignore') {
            $stmt = $conn->prepare("UPDATE chat_requests SET status = 'ignored' WHERE id = ?");
            $stmt->execute([$request_id]);
            echo json_encode(['status' => 'success', 'message' => 'Request ignored']);
            exit();
        }

        if ($action === 'accept') {
            $from_user_id = $reqData['from_user_id'];
            $message = $reqData['message'];

            $conn->beginTransaction();

            // Check if conversation already exists (race condition check)
            $stmt = $conn->prepare("
                SELECT p1.conversation_id 
                FROM participants p1
                JOIN participants p2 ON p1.conversation_id = p2.conversation_id
                JOIN conversations c ON p1.conversation_id = c.id
                WHERE p1.user_id = ? AND p2.user_id = ? AND c.type = 'direct_message'
                LIMIT 1 FOR UPDATE
            ");
            $stmt->execute([$user_id, $from_user_id]);
            $existing_conversation = $stmt->fetchColumn();

            if (!$existing_conversation) {
                // Create conversation
                $stmt = $conn->prepare("INSERT INTO conversations (type) VALUES ('direct_message')");
                $stmt->execute();
                $conversation_id = $conn->lastInsertId();

                // Add participants
                $stmt = $conn->prepare("INSERT INTO participants (conversation_id, user_id) VALUES (?, ?), (?, ?)");
                $stmt->execute([$conversation_id, $user_id, $conversation_id, $from_user_id]);

                // Insert initial message
                if (!empty($message)) {
                    $stmt = $conn->prepare("INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)");
                    $stmt->execute([$conversation_id, $from_user_id, $message]);
                }
            } else {
                $conversation_id = $existing_conversation;
            }

            // Delete request
            $stmt = $conn->prepare("DELETE FROM chat_requests WHERE id = ?");
            $stmt->execute([$request_id]);

            $conn->commit();
            echo json_encode(['status' => 'success', 'data' => ['conversation_id' => $conversation_id], 'message' => 'Request accepted']);
            exit();
        }
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
    exit();
}

// Fallback
http_response_code(404);
echo json_encode(['status' => 'error', 'message' => 'Route not found']);
?>
