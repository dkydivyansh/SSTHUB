<?php
require_once __DIR__ . '/public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();

$sql = file_get_contents(__DIR__ . '/public/includes/database.sql');
try {
    $conn->exec($sql);
    echo "Database tables created/updated successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
