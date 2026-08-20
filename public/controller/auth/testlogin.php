<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/SessionManager.php';

$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (preg_match('#^/testlogin/8840/(.+)$#', $request_uri, $matches)) {
    $email = urldecode($matches[1]);
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Extract rollno/name logic roughly similar to callback.php
    $local_part = explode('@', $email)[0];
    $parts = explode('.', $local_part);
    $rollno = end($parts);
    $name = ucfirst($parts[0] ?? 'Test');
    $batch = null;
    if (preg_match('/^(\d{2})/', $rollno, $matches)) {
        $batch = intval("20" . (intval($matches[1]) + 4));
    }
    
    try {
        // Check if user exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user_id = $stmt->fetchColumn();
        
        if (!$user_id) {
            // Create user
            $conn->beginTransaction();
            $stmt = $conn->prepare("INSERT INTO users (email, sso) VALUES (?, ?)");
            $stmt->execute([$email, 1]);
            $user_id = $conn->lastInsertId();
            
            $stmt = $conn->prepare("
                INSERT INTO userdata (user_id, name, rollno, avatar, batch) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $user_id, 
                $name, 
                $rollno, 
                'https://api.dicebear.com/7.x/avataaars/svg?seed=' . rand(),
                $batch
            ]);
            $conn->commit();
        }
        
        // Create session (matches callback.php pattern)
        $sessionManager = new SessionManager($conn);
        $sessionData = $sessionManager->createSession($user_id, ['user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown']);
        
        setcookie('session_id', $sessionData['session_id'], time() + (24 * 60 * 60), '/', '', false, true);
        setcookie('refresh_token', $sessionData['refresh_token'], time() + (7 * 24 * 60 * 60), '/', '', false, true);
        setcookie('user_id', $user_id, time() + (7 * 24 * 60 * 60), '/', '', false, true);
        
        header('Location: /dash');
        exit();
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        die("Error: " . $e->getMessage());
    }
}
