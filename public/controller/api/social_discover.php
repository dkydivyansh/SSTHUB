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

if ($status === 'invalid_session') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid session']);
    exit();
}

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$batch = isset($_GET['batch']) ? intval($_GET['batch']) : null;
$group = isset($_GET['group']) ? trim($_GET['group']) : null;
$type = isset($_GET['type']) ? trim($_GET['type']) : null;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;

if ($page < 1) $page = 1;
$limit = 20;
$offset = ($page - 1) * $limit;

if (strlen($q) < 3) {
    echo json_encode(['status' => 'success', 'data' => []]);
    exit();
}

$query = "SELECT u.email, ud.name, ud.rollno, ud.avatar, ud.batch, ud.`group`, ud.type, ud.extra
          FROM userdata ud
          JOIN users u ON ud.user_id = u.id
          WHERE ud.status = 'active' AND ud.user_id != ?";

$params = [$user_id];

$query .= " AND (ud.name LIKE ? OR ud.rollno LIKE ?)";
$searchTerm = "%" . $q . "%";
$params[] = $searchTerm;
$params[] = $searchTerm;

if ($batch) {
    $query .= " AND ud.batch = ?";
    $params[] = $batch;
}

if ($group) {
    $query .= " AND ud.`group` = ?";
    $params[] = $group;
}

if ($type) {
    $mappedType = $type === 'student' ? 'member' : $type;
    $query .= " AND ud.type = ?";
    $params[] = $mappedType;
}

$query .= " LIMIT " . intval($limit) . " OFFSET " . intval($offset);

try {
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as &$row) {
        if ($row['extra']) {
            $extra = json_decode($row['extra'], true);
            $row['description'] = isset($extra['description']) ? $extra['description'] : '';
            unset($row['extra']); 
        } else {
            $row['description'] = '';
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $results]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'debug' => $e->getMessage()]);
}
