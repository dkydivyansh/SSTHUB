<?php
require_once __DIR__ . '/public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        group_id VARCHAR(50) NOT NULL,
        last_read_announcements INT DEFAULT 0,
        last_read_events INT DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        extras JSON,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE,
        UNIQUE KEY unique_membership (user_id, group_id)
    );
    ";
    
    $conn->exec($sql);
    echo "Successfully created group_members table.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
