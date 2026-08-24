<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
    exit();
}

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
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized or Disabled']);
    exit();
}

// Check current status in DB to ensure they are pending
$stmt = $conn->prepare("SELECT status, type FROM userdata WHERE user_id = ?");
$stmt->execute([$user_id]);
$currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$currentUser || $currentUser['status'] !== 'pending') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Account is already active or disabled.']);
    exit();
}

$is_faculty = ($currentUser['type'] === 'faculty');
$group = $input['group'] ?? null;

if (!$is_faculty && !in_array($group, ['A', 'B', 'C', 'D'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid group selected. Must be A, B, C, or D.']);
    exit();
}

if ($is_faculty) {
    $group = null;
}

$github = htmlspecialchars(trim($input['github'] ?? ''));
$portfolio = htmlspecialchars(trim($input['portfolio'] ?? ''));
$instagram = htmlspecialchars(trim($input['instagram'] ?? ''));
$linkedin = htmlspecialchars(trim($input['linkedin'] ?? ''));
$hackerone = htmlspecialchars(trim($input['hackerone'] ?? ''));
$orcid = htmlspecialchars(trim($input['orcid'] ?? ''));
$nlogn = htmlspecialchars(trim($input['nlogn_username'] ?? ''));
$description = htmlspecialchars(trim($input['description'] ?? ''));

$raw_interests = $input['interests'] ?? [];
$interests = [];
if (is_array($raw_interests)) {
    foreach ($raw_interests as $interest) {
        if (is_string($interest)) {
            $sanitized = strip_tags(trim($interest));
            if (!empty($sanitized) && strlen($sanitized) <= 30) {
                $interests[] = $sanitized;
            }
        }
    }
}
$interests = array_slice($interests, 0, 15);

$raw_papers = $input['papers'] ?? [];
$papers = [];
if (is_array($raw_papers)) {
    foreach ($raw_papers as $paper) {
        if (is_array($paper) && isset($paper['title']) && is_string($paper['title'])) {
            $title = strip_tags(trim($paper['title']));
            $link = isset($paper['link']) && is_string($paper['link']) ? strip_tags(trim($paper['link'])) : '';
            if (!empty($title)) {
                $papers[] = [
                    'title' => $title,
                    'link' => $link
                ];
            }
        }
    }
}
$papers = array_slice($papers, 0, 5);

// Strict validations removed as frontend handles input constraints

$extra = [
    "description" => $description,
    "social" => [
        "github" => $github,
        "portfolio" => $portfolio,
        "instagram" => $instagram,
        "linkedin" => $linkedin,
        "hackerone" => $hackerone
    ],
    "clubs" => [
        "nlogn" => $nlogn
    ],
    "research" => [
        "orcid" => $orcid,
        "papers" => $papers
    ],
    "interests" => $interests
];

$extraJson = json_encode($extra);

$stmt = $conn->prepare("UPDATE userdata SET `group` = ?, extra = ?, status = 'active' WHERE user_id = ?");
$success = $stmt->execute([$group, $extraJson, $user_id]);

if ($success) {
    echo json_encode(['status' => 'success', 'message' => 'Onboarding complete']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
