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

if ($request_uri === '/auth/callback') {
    require_once __DIR__ . '/controller/auth/callback.php';
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
