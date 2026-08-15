<?php
require_once __DIR__ . '/public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS attachments (
        id VARCHAR(36) PRIMARY KEY,
        user_id INT NOT NULL,
        conversation_id BIGINT NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    ";
    $conn->exec($sql);
    echo "Successfully created attachments table.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
