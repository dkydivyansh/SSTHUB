<?php
require_once __DIR__ . '/public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();

try {
    $conn->exec("ALTER TABLE messages MODIFY COLUMN content LONGTEXT NOT NULL;");
    echo "Successfully updated messages.content to LONGTEXT.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
