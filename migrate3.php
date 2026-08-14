<?php
require_once __DIR__ . '/public/includes/db.php';

$db = new Database();
$conn = $db->getConnection();

try {
    // Add last_seen_message_id to participants
    $conn->exec("ALTER TABLE participants ADD COLUMN last_seen_message_id BIGINT DEFAULT 0 AFTER joined_at");
    echo "Successfully added last_seen_message_id to participants table.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
         echo "Column last_seen_message_id already exists in participants table.\n";
    } else {
         echo "Error updating participants table: " . $e->getMessage() . "\n";
    }
}
?>
