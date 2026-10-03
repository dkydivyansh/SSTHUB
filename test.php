<?php
require 'public/includes/db.php';
$db = new Database();
$conn = $db->getConnection();
$res = $conn->query('SELECT * FROM shop_orders LIMIT 1')->fetchAll(PDO::FETCH_ASSOC);
print_r($res);
