<?php
require_once __DIR__ . '/public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS community_groups (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        custom_pages JSON,
        logo VARCHAR(255),
        description TEXT,
        extras JSON,
        type ENUM('public', 'private') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        groupid VARCHAR(50) NOT NULL,
        context JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        pinned BOOLEAN DEFAULT FALSE,
        extras JSON,
        created_by INT NOT NULL,
        FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        groupid VARCHAR(50) NOT NULL,
        context JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        pinned BOOLEAN DEFAULT FALSE,
        extras JSON,
        created_by INT NOT NULL,
        FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );
    ";
    
    $conn->exec($sql);
    echo "Successfully created community_groups, announcements, and events tables.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
