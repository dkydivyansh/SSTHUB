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

if ($request_uri === '/api/check_status') {
    require_once __DIR__ . '/controller/api/check_status.php';
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
if ($request_uri === '/api/inbox') {
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

if (strpos($request_uri, '/api/upload_chunk') === 0) {
    require_once __DIR__ . '/controller/api/upload_chunk.php';
    exit();
}

if (strpos($request_uri, '/api/attachments') === 0) {
    require_once __DIR__ . '/controller/api/attachments.php';
    exit();
}

if (strpos($request_uri, '/api/group_attachment_upload') === 0) {
    require_once __DIR__ . '/controller/api/group_attachment_upload.php';
    exit();
}

if (strpos($request_uri, '/api/group_attachment_get') === 0) {
    require_once __DIR__ . '/controller/api/group_attachment_get.php';
    exit();
}

if ($request_uri === '/api/image_proxy') {
    require_once __DIR__ . '/controller/api/image_proxy.php';
    exit();
}

if ($request_uri === '/api/link_preview') {
    require_once __DIR__ . '/controller/api/link_preview.php';
    exit();
}

if (strpos($request_uri, '/api/admin/users') === 0) {
    require_once __DIR__ . '/controller/api/admin_users.php';
    exit();
}

if (strpos($request_uri, '/api/admin/groups') === 0) {
    require_once __DIR__ . '/controller/api/admin_groups.php';
    exit();
}

if (strpos($request_uri, '/api/admin/classes') === 0) {
    require_once __DIR__ . '/controller/api/admin_classes.php';
    exit();
}

if (strpos($request_uri, '/api/faculty/classes') === 0) {
    require_once __DIR__ . '/controller/api/faculty_classes.php';
    exit();
}

if (strpos($request_uri, '/api/homework/create') === 0) {
    require_once __DIR__ . '/controller/api/create_homework.php';
    exit();
}

if (strpos($request_uri, '/api/homework/edit') === 0) {
    require_once __DIR__ . '/controller/api/edit_homework.php';
    exit();
}

if (strpos($request_uri, '/api/homework/delete') === 0) {
    require_once __DIR__ . '/controller/api/delete_homework.php';
    exit();
}

if (strpos($request_uri, '/api/homework/get') === 0) {
    require_once __DIR__ . '/controller/api/get_homework.php';
    exit();
}

if (strpos($request_uri, '/api/homework/submit') === 0) {
    require_once __DIR__ . '/controller/api/submit_homework.php';
    exit();
}


if (strpos($request_uri, '/api/community') === 0) {
    require_once __DIR__ . '/controller/api/community.php';
    exit();
}

if (strpos($request_uri, '/api/group_data') === 0) {
    require_once __DIR__ . '/controller/api/group_data.php';
    exit();
}

if ($request_uri === '/api/dashboard_feed') {
    require_once __DIR__ . '/controller/api/dashboard_feed.php';
    exit();
}

if ($request_uri === '/api/events_feed') {
    require_once __DIR__ . '/controller/api/events_feed.php';
    exit();
}

if ($request_uri === '/api/group_settings') {
    require_once __DIR__ . '/controller/api/group_settings.php';
    exit();
}

if ($request_uri === '/api/add_post') {
    require_once __DIR__ . '/controller/api/add_post.php';
    exit();
}

if ($request_uri === '/api/get_post') {
    require_once __DIR__ . '/controller/api/get_post.php';
    exit();
}

if ($request_uri === '/api/edit_post') {
    require_once __DIR__ . '/controller/api/edit_post.php';
    exit();
}

if ($request_uri === '/api/delete_post') {
    require_once __DIR__ . '/controller/api/delete_post.php';
    exit();
}

if ($request_uri === '/api/pin_post') {
    require_once __DIR__ . '/controller/api/pin_post.php';
    exit();
}

if ($request_uri === '/api/mark_group_read') {
    require_once __DIR__ . '/controller/api/mark_group_read.php';
    exit();
}

if ($request_uri === '/api/unread_counts') {
    require_once __DIR__ . '/controller/api/unread_counts.php';
    exit();
}

if ($request_uri === '/api/group_unread_counts') {
    require_once __DIR__ . '/controller/api/group_unread_counts.php';
    exit();
}

if (strpos($request_uri, '/api/search_posts') === 0) {
    require_once __DIR__ . '/controller/api/search_posts.php';
    exit();
}

if (strpos($request_uri, '/check_db') === 0) {
    require_once __DIR__ . '/check_db.php';
    exit();
}

// Server-side redirection based on user status for frontend routes
if (strpos($request_uri, '/api/') !== 0 && strpos($request_uri, '/auth/') !== 0 && $request_uri !== '/testlogin') {
    $user_id = $_COOKIE['user_id'] ?? null;
    $session_id = $_COOKIE['session_id'] ?? null;
    
    if ($user_id && $session_id) {
        require_once __DIR__ . '/includes/SessionManager.php';
        $sessionManager = new SessionManager($conn);
        $status = $sessionManager->validateSessionStatus($user_id, $session_id);
        
        if ($status === 'valid') {
            $stmt = $conn->prepare("SELECT status, type FROM userdata WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($userRow) {
                $userStatus = $userRow['status'];
                $userType = $userRow['type'];
                
                // Block non-faculty/admin from accessing /faculty
                if (strpos($request_uri, '/faculty') === 0 && $userType !== 'faculty' && $userType !== 'admin') {
                    header("Location: /dash");
                    exit();
                }

                // Redirect pending users to onboarding (unless already there)
                if ($userStatus === 'pending' && $request_uri !== '/onboarding') {
                    header("Location: /onboarding");
                    exit();
                } 
                // Redirect disabled users to disabled page
                else if ($userStatus === 'disabled' && $request_uri !== '/disabled') {
                    header("Location: /disabled");
                    exit();
                } 
                // Redirect active users away from onboarding and root
                else if ($userStatus === 'active' && ($request_uri === '/onboarding' || $request_uri === '/')) {
                    header("Location: /dash");
                    exit();
                }
            }
        }
    }
}

// Default route - Serve the React application
$html_file = __DIR__ . '/index.html';
if (file_exists($html_file)) {
    // We are serving HTML, so override the JSON content type
    header('Content-Type: text/html');
    
    $html_content = file_get_contents($html_file);
    
    // Default OG metadata
    $og_title = "SSTHub";
    $og_desc = "The central hub for students of the Scaler School of Technology. Connect, discover, and organize your campus life.";
    $og_image = "https://" . $_SERVER['HTTP_HOST'] . "/HUB.png";
    $og_url = "https://" . $_SERVER['HTTP_HOST'] . $request_uri;

    // You can add dynamic logic here, for example querying $conn if $request_uri matches /post/xxx
    // if (preg_match('#^/post/(\d+)#', $request_uri, $matches)) { ... }
    
    $dynamic_og = <<<HTML
  <!-- Dynamic Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{$og_url}" />
  <meta property="og:title" content="{$og_title}" />
  <meta property="og:description" content="{$og_desc}" />
  <meta property="og:image" content="{$og_image}" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="{$og_url}" />
  <meta property="twitter:title" content="{$og_title}" />
  <meta property="twitter:description" content="{$og_desc}" />
  <meta property="twitter:image" content="{$og_image}" />
HTML;

    // Replace the static OG tags block with our dynamic one
    $html_content = preg_replace(
        '/<!-- Open Graph \/ Facebook -->.*?<meta property="twitter:image" content="[^"]+" \/>/s',
        $dynamic_og,
        $html_content
    );

    echo $html_content;
} else {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'Frontend build not found.'
    ]);
}
?>
