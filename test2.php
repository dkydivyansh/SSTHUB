<?php
require 'public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();
// Store 2
$stmt = $conn->prepare("SELECT * FROM shop_orders WHERE store_id = 2 ORDER BY placed_at ASC");
$stmt->execute();
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($orders, JSON_PRETTY_PRINT);
