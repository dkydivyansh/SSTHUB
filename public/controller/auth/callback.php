<?php
require_once __DIR__ . '/../../includes/config.php';

// Check if there is an error in the callback
if (isset($_GET['error'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $_GET['error']]);
    exit();
}

// Check if we have an authorization code
if (!isset($_GET['code'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Authorization code is missing']);
    exit();
}

$code = $_GET['code'];

// Dynamically determine the redirect URI
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$redirect_uri = isset($_GET['state']) ? $_GET['state'] : ($protocol . '://' . $host . '/auth/callback');

// Prepare POST data to exchange the code for an access token
$token_url = 'https://oauth2.googleapis.com/token';
$post_data = [
    'code' => $code,
    'client_id' => GOOGLE_CLIENT_ID,
    'client_secret' => GOOGLE_CLIENT_SECRET,
    'redirect_uri' => $redirect_uri,
    'grant_type' => 'authorization_code'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $token_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$token_response_raw = curl_exec($ch);

if ($token_response_raw === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'cURL Error: ' . curl_error($ch)]);
    exit();
}
curl_close($ch);

$token_response = json_decode($token_response_raw, true);

if (!is_array($token_response) || isset($token_response['error'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to obtain access token',
        'details' => $token_response ?? $token_response_raw
    ]);
    exit();
}

$access_token = $token_response['access_token'];

// Use the access token to get user info
$user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $user_info_url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$user_info_raw = curl_exec($ch);

if ($user_info_raw === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'cURL Error: ' . curl_error($ch)]);
    exit();
}
curl_close($ch);

$user_info = json_decode($user_info_raw, true);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

$db = new Database();
$conn = $db->getConnection();

$email = $user_info['email'] ?? null;
$name = $user_info['name'] ?? 'Unknown User';
$picture = $user_info['picture'] ?? null;

if (!$email) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Email is required from Google']);
    exit();
}

$is_faculty = false;
$user_type = 'member';

if (preg_match('/@sst\.scaler\.com$/i', $email)) {
    $user_type = 'member';
} elseif (preg_match('/@scaler\.com$/i', $email)) {
    $user_type = 'faculty';
    $is_faculty = true;
} else {
    header('Location: /login?error=' . urlencode('Only @sst.scaler.com or @scaler.com emails are allowed.'));
    exit();
}

// Extract Rollno and Batch
$local_part = explode('@', $email)[0];
$parts = explode('.', $local_part);
$rollno = end($parts);
$batch = null;

// Edge case logic: if it doesn't look like a student roll number (starts with 2 digits), set to null
if (preg_match('/^(\d{2})/', $rollno, $matches)) {
    $batch = intval("20" . (intval($matches[1]) + 4));
} else {
    $rollno = null;
    $batch = null;
}

// Check if user exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // Insert into users
    $stmt = $conn->prepare("INSERT INTO users (email, sso) VALUES (?, FALSE)");
    $stmt->execute([$email]);
    $user_id = $conn->lastInsertId();

    // Insert into userdata
    $stmt = $conn->prepare("INSERT INTO userdata (user_id, name, avatar, rollno, batch, status, type) VALUES (?, ?, ?, ?, ?, 'pending', ?)");
    $stmt->execute([$user_id, $name, $picture, $rollno, $batch, $user_type]);

    // Auto-join SST General group if it exists
    $stmt = $conn->prepare("SELECT id FROM community_groups WHERE name = 'SST General' LIMIT 1");
    $stmt->execute();
    $sst_general = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($sst_general) {
        $group_id = $sst_general['id'];
        $stmt = $conn->prepare("INSERT IGNORE INTO group_members (user_id, group_id) VALUES (?, ?)");
        $stmt->execute([$user_id, $group_id]);
    }

    // Auto-join batch-specific group (e.g., 'SST 2028') if it exists
    if ($batch) {
        $batch_group_name = "SST " . $batch;
        $stmt = $conn->prepare("SELECT id FROM community_groups WHERE name = ? LIMIT 1");
        $stmt->execute([$batch_group_name]);
        $batch_group = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($batch_group) {
            $group_id = $batch_group['id'];
            $stmt = $conn->prepare("INSERT IGNORE INTO group_members (user_id, group_id) VALUES (?, ?)");
            $stmt->execute([$user_id, $group_id]);
        }
    }
} else {
    $user_id = $user['id'];
    $stmt = $conn->prepare("UPDATE userdata SET name = ?, avatar = ?, rollno = ?, batch = ? WHERE user_id = ?");
    $stmt->execute([$name, $picture, $rollno, $batch, $user_id]);
}

// Create session
$sessionManager = new SessionManager($conn);
$sessionData = $sessionManager->createSession($user_id, ['user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown']);

// Set HTTP-only Cookies
setcookie('session_id', $sessionData['session_id'], time() + (24 * 60 * 60), '/', '', false, true);
setcookie('refresh_token', $sessionData['refresh_token'], time() + (7 * 24 * 60 * 60), '/', '', false, true);
setcookie('user_id', $user_id, time() + (7 * 24 * 60 * 60), '/', '', false, true);

// Redirect to dashboard
header('Location: /dash');
exit();
