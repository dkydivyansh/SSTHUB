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
$redirect_uri = $protocol . '://' . $host . '/auth/callback';

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
$token_response_raw = curl_exec($ch);
curl_close($ch);

$token_response = json_decode($token_response_raw, true);

if (isset($token_response['error'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to obtain access token',
        'details' => $token_response
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
$user_info_raw = curl_exec($ch);
curl_close($ch);

$user_info = json_decode($user_info_raw, true);

// Per instructions, do not create session handler yet, just return the callback response
echo json_encode([
    'status' => 'success',
    'message' => 'Google Login successful',
    'data' => [
        'token_response' => $token_response,
        'user_info' => $user_info
    ]
]);
?>
