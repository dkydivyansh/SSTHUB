<?php
require_once __DIR__ . '/config.php';

class Database {
    private $conn;

    public function __construct() {
        $this->connect();
        $this->checkAndCreateTables();
    }

    private function connect() {
        try {
            // Connect to MySQL server specifying the DB
            $this->conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die(json_encode([
                "status" => "error", 
                "message" => "Connection failed: " . $e->getMessage()
            ]));
        }
    }

    private function checkAndCreateTables() {
        try {
            $stmt = $this->conn->query("SHOW TABLES LIKE 'users'");
            $stmt2 = $this->conn->query("SHOW TABLES LIKE 'userdata'");
            $stmt3 = $this->conn->query("SHOW TABLES LIKE 'sessions'");
            
            if ($stmt->rowCount() == 0 || $stmt2->rowCount() == 0 || $stmt3->rowCount() == 0) {
                // One of the tables doesn't exist, run the script
                $sqlPath = __DIR__ . '/database.sql';
                if (file_exists($sqlPath)) {
                    $sql = file_get_contents($sqlPath);
                    $this->conn->exec($sql);
                }
            }
        } catch (PDOException $e) {
            error_log("Error checking/creating tables: " . $e->getMessage());
        }
    }

    public function getConnection() {
        return $this->conn;
    }

    public function __destruct() {
        $this->conn = null;
    }
}
?>
