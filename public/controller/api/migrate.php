<?php
require_once __DIR__ . '/../../includes/db.php';

$db = new Database();
$conn = $db->getConnection();

$sql = "
CREATE TABLE IF NOT EXISTS group_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupid VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(12) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE
);
";

try {
    $conn->exec($sql);
    echo "Table group_invites created successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
