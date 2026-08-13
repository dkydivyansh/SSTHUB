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
$stmt = $conn->prepare("SELECT status FROM userdata WHERE user_id = ?");
$stmt->execute([$user_id]);
$currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$currentUser || $currentUser['status'] !== 'pending') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Account is already active or disabled.']);
    exit();
}

$group = $input['group'] ?? null;
if (!in_array($group, ['A', 'B', 'C', 'D'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid group selected. Must be A, B, C, or D.']);
    exit();
}

$github = htmlspecialchars(trim($input['github'] ?? ''));
$portfolio = htmlspecialchars(trim($input['portfolio'] ?? ''));
$instagram = htmlspecialchars(trim($input['instagram'] ?? ''));
$linkedin = htmlspecialchars(trim($input['linkedin'] ?? ''));
$gdev = htmlspecialchars(trim($input['gdev'] ?? ''));
$hackerone = htmlspecialchars(trim($input['hackerone'] ?? ''));
$orcid = htmlspecialchars(trim($input['orcid'] ?? ''));
$nlogn = htmlspecialchars(trim($input['nlogn_username'] ?? ''));
$description = htmlspecialchars(trim($input['description'] ?? ''));

// Validate description length
if (!empty($description) && str_word_count($description) > 60) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Profile description is too long. Please keep it under 50 words.']);
    exit();
}

function isURL($string) {
    if (empty($string)) return false;
    return preg_match('/https?:\/\//i', $string) || strpos($string, '/') !== false;
}

$fieldsToValidate = [
    'GitHub' => $github,
    'Instagram' => $instagram,
    'LinkedIn' => $linkedin,
    'Google Dev' => $gdev,
    'HackerOne' => $hackerone,
    'ORCID' => $orcid,
    'CP Club' => $nlogn
];

foreach ($fieldsToValidate as $name => $value) {
    if (isURL($value)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Please enter only your $name handle/ID, not a full URL."]);
        exit();
    }
}

$extra = [
    "description" => $description,
    "social" => [
        "github" => $github,
        "portfolio" => $portfolio,
        "instagram" => $instagram,
        "linkedin" => $linkedin,
        "gdev" => $gdev,
        "hackerone" => $hackerone
    ],
    "clubs" => [
        "nlogn" => $nlogn
    ],
    "research" => [
        "orcid" => $orcid
    ]
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
