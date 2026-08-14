<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/includes/db.php';

// Initialize the database connection
$db = new Database();
$conn = $db->getConnection();

// Basic Routing
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($request_uri === '/api/profile') {
    require_once __DIR__ . '/controller/api/profile.php';
    exit();
}

if ($request_uri === '/api/session') {
    require_once __DIR__ . '/controller/api/session.php';
    exit();
}

if ($request_uri === '/api/onboarding') {
    require_once __DIR__ . '/controller/api/onboarding.php';
    exit();
}

if ($request_uri === '/api/profile_update') {
    require_once __DIR__ . '/controller/api/profile_update.php';
    exit();
}

if ($request_uri === '/auth/callback') {
    require_once __DIR__ . '/controller/auth/callback.php';
    exit();
}
if ($request_uri === '/api/social_discover') {
    require_once __DIR__ . '/controller/api/social_discover.php';
    exit();
}

if (strpos($request_uri, '/auth/') === 0) {
    if (strpos($request_uri, '/auth/login') === 0) {
        require_once __DIR__ . '/controller/auth/login.php';
        exit();
    }
    if (strpos($request_uri, '/auth/callback') === 0) {
        require_once __DIR__ . '/controller/auth/callback.php';
        exit();
    }
    if (strpos($request_uri, '/auth/logout') === 0) {
        require_once __DIR__ . '/controller/auth/logout.php';
        exit();
    }
}

if (strpos($request_uri, '/testlogin/') === 0) {
    require_once __DIR__ . '/controller/auth/testlogin.php';
    exit();
}
if (preg_match('#^/api/users/([^/]+)/inbox$#', $request_uri)) {
    require_once __DIR__ . '/controller/api/inbox.php';
    exit();
}

if (strpos($request_uri, '/api/public_profile') === 0) {
    require_once __DIR__ . '/controller/api/public_profile.php';
    exit();
}

if (strpos($request_uri, '/api/conversations') === 0) {
    require_once __DIR__ . '/controller/api/conversations.php';
    exit();
}

if (strpos($request_uri, '/api/chat_requests') === 0) {
    require_once __DIR__ . '/controller/api/chat_requests.php';
    exit();
}

// Default route - Serve the React application
$html_file = __DIR__ . '/index.html';
if (file_exists($html_file)) {
    // We are serving HTML, so override the JSON content type
    header('Content-Type: text/html');
    readfile($html_file);
} else {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'Frontend build not found.'
    ]);
}
?>
