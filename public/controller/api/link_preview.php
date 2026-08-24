<?php
require_once __DIR__ . '/../../includes/SessionManager.php';

$url = $_GET['url'] ?? '';

if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid URL']);
    exit();
}

// Timeout 3s to not block requests on slow sites
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 3,
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    ]
]);

$html = @file_get_contents($url, false, $context);

if ($html === false) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch URL']);
    exit();
}

$og = [
    'title' => '',
    'description' => '',
    'image' => ''
];

// Title (og:title fallback to <title>)
if (preg_match('/<meta[^>]*property=["\']og:title["\'][^>]*content=["\'](.*?)["\']/i', $html, $matches) || 
    preg_match('/<meta[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:title["\']/i', $html, $matches)) {
    $og['title'] = html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
} else if (preg_match('/<title[^>]*>(.*?)<\/title>/i', $html, $matches)) {
    $og['title'] = html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// Description (og:description fallback to <meta name="description">)
if (preg_match('/<meta[^>]*property=["\']og:description["\'][^>]*content=["\'](.*?)["\']/i', $html, $matches) || 
    preg_match('/<meta[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:description["\']/i', $html, $matches)) {
    $og['description'] = html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
} else if (preg_match('/<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']/i', $html, $matches) || 
           preg_match('/<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']/i', $html, $matches)) {
    $og['description'] = html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// Image (og:image)
if (preg_match('/<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](.*?)["\']/i', $html, $matches) || 
    preg_match('/<meta[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:image["\']/i', $html, $matches)) {
    $og['image'] = html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // Ensure image is absolute
    if (strpos($og['image'], '/') === 0) {
        $parsed_url = parse_url($url);
        $base = $parsed_url['scheme'] . '://' . $parsed_url['host'];
        $og['image'] = $base . $og['image'];
    }
}

echo json_encode(['status' => 'success', 'data' => $og]);
