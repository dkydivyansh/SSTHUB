<?php
require_once __DIR__ . '/public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS groupadmin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        groupid VARCHAR(50) NOT NULL,
        userids JSON NOT NULL,
        modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE
    );
    ";
    
    $conn->exec($sql);
    echo "Successfully created groupadmin table.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
