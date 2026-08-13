<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

header('Content-Type: application/json');

// 1. Strictly verify JSON formatting
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
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

// 2. Validate Allowed Keys and Values
$allowed_keys = ['group', 'description', 'github', 'portfolio', 'instagram', 'linkedin', 'hackerone', 'orcid', 'nlogn_username', 'disable_public_profile', 'interests', 'papers'];

foreach (array_keys($input) as $key) {
    if (!in_array($key, $allowed_keys)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Invalid key found in payload: $key"]);
        exit();
    }
}

$group = $input['group'] ?? null;
if (!in_array($group, ['A', 'B', 'C', 'D'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid group selected. Must be A, B, C, or D.']);
    exit();
}

// 3. Extract and Sanitize String Values
$github = strip_tags(trim($input['github'] ?? ''));
$portfolio = strip_tags(trim($input['portfolio'] ?? ''));
$instagram = strip_tags(trim($input['instagram'] ?? ''));
$linkedin = strip_tags(trim($input['linkedin'] ?? ''));
$hackerone = strip_tags(trim($input['hackerone'] ?? ''));
$orcid = strip_tags(trim($input['orcid'] ?? ''));
$nlogn = strip_tags(trim($input['nlogn_username'] ?? ''));
$description = strip_tags(trim($input['description'] ?? ''));
$disable_public_profile = isset($input['disable_public_profile']) ? (bool)$input['disable_public_profile'] : false;

$raw_interests = $input['interests'] ?? [];
if (!is_array($raw_interests)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Interests must be an array']);
    exit();
}

$interests = [];
foreach ($raw_interests as $interest) {
    if (is_string($interest)) {
        $sanitized = strip_tags(trim($interest));
        if (!empty($sanitized) && strlen($sanitized) <= 30) {
            $interests[] = $sanitized;
        }
    }
}

// Cap at 15 interests
$interests = array_slice($interests, 0, 15);

$raw_papers = $input['papers'] ?? [];
if (!is_array($raw_papers)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Papers must be an array']);
    exit();
}

$papers = [];
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

// Cap at 5 papers
$papers = array_slice($papers, 0, 5);

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
    'HackerOne' => $hackerone,
    'ORCID' => $orcid,
    'CP Club' => $nlogn
];

// 4. Strict Handle/Username Validation
foreach ($fieldsToValidate as $name => $value) {
    if (isURL($value)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Please enter only your $name handle/ID, not a full URL."]);
        exit();
    }
    
    // Additional validation for handles (alphanumeric, dashes, underscores)
    if (!empty($value) && !preg_match('/^[a-zA-Z0-9\-_.]+$/', $value)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "$name handle contains invalid characters."]);
        exit();
    }
}

// Pack structured JSON for DB
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
    "interests" => $interests,
    "disable_public_profile" => $disable_public_profile
];

$extraJson = json_encode($extra);

$stmt = $conn->prepare("UPDATE userdata SET `group` = ?, extra = ? WHERE user_id = ?");
$success = $stmt->execute([$group, $extraJson, $user_id]);

if ($success) {
    echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
