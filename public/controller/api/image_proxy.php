<?php
require_once __DIR__ . '/../../includes/SessionManager.php';

$url = $_GET['url'] ?? '';

// Basic SSRF protection: only allow http and https
if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//i', $url)) {
    http_response_code(400);
    exit('Invalid URL');
}

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 5,
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'header' => "Accept: image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8\r\n"
    ]
]);

$image_data = @file_get_contents($url, false, $context);

if ($image_data === false) {
    http_response_code(404);
    exit('Image not found');
}

$content_type = 'image/jpeg'; // fallback
if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (preg_match('/^Content-Type:\s*(.+)$/i', $header, $matches)) {
            $content_type = trim($matches[1]);
            break;
        }
    }
}

// Ensure the content type is actually an image (or octet stream) to prevent XSS
if (strpos($content_type, 'image/') !== 0 && strpos($content_type, 'application/octet-stream') !== 0) {
    http_response_code(400);
    exit('Invalid content type');
}

// Cache the image heavily on the client side
header('Content-Type: ' . $content_type);
header('Cache-Control: public, max-age=604800, immutable'); // Cache for 1 week
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 604800) . ' GMT');

echo $image_data;
