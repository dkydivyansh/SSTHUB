<?php
require_once __DIR__ . '/public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();

$sql = "ALTER TABLE participants ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;";

try {
    $conn->exec($sql);
    echo "Migration successful\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
