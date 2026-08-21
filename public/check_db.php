<?php
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/includes/db.php';

// A standalone diagnostic script to verify the production database schema matches database.sql

$db = new Database();
$conn = $db->getConnection();

echo "<!DOCTYPE html><html><head><title>Database Schema Checker</title>";
echo "<style>
    body { font-family: system-ui; background: #FFF5E1; padding: 2rem; color: #111; }
    h1, h2 { text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900; }
    .card { background: white; border: 2px solid black; padding: 1rem; margin-bottom: 1rem; box-shadow: 4px 4px 0 black; }
    .success { color: #059669; font-weight: bold; }
    .error { color: #DC2626; font-weight: bold; }
    .warning { color: #D97706; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
</style></head><body>";
echo "<h1>Database Schema Diagnostic Tool</h1>";

// 1. Read and parse database.sql
$sqlPath = __DIR__ . '/includes/database.sql';
if (!file_exists($sqlPath)) {
    die("<div class='card error'>Error: database.sql not found at $sqlPath</div>");
}

$sqlContent = file_get_contents($sqlPath);

// Strip multi-line and single-line SQL comments to prevent them from breaking the parser
$sqlContent = preg_replace('!/\*.*?\*/!s', '', $sqlContent);
$sqlContent = preg_replace('/--.*$/m', '', $sqlContent);

$tablesExpected = [];
$indexesExpected = [];

// Simple regex parsing to extract tables and columns
// Matches: CREATE TABLE [IF NOT EXISTS] tablename ( ... )
preg_match_all('/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?([a-zA-Z0-9_]+)`?\s*\((.*?)\);/is', $sqlContent, $tableMatches, PREG_SET_ORDER);

foreach ($tableMatches as $match) {
    $tableName = trim($match[1]);
    $body = $match[2];
    
    $tablesExpected[$tableName] = [];
    
    // Split by commas, ignoring commas inside parentheses (like ENUM('a','b'))
    $lines = preg_split('/,(?![^\(]*\))/i', $body);
    foreach ($lines as $line) {
        $line = trim($line);
        // Ignore constraints and keys for basic column checking
        if (empty($line) || preg_match('/^(FOREIGN KEY|PRIMARY KEY|UNIQUE KEY|KEY|CONSTRAINT)\b/i', $line)) {
            continue;
        }
        
        // Extract column name and type
        if (preg_match('/^`?([a-zA-Z0-9_]+)`?\s+([a-zA-Z0-9_\(\)\']+)/i', $line, $colMatch)) {
            $colName = $colMatch[1];
            $colType = strtoupper(trim($colMatch[2]));
            $tablesExpected[$tableName][$colName] = $colType;
        }
    }
}

// Extract Indexes
preg_match_all('/CREATE INDEX\s+`?([a-zA-Z0-9_]+)`?\s+ON\s+`?([a-zA-Z0-9_]+)`?\s*\((.*?)\)/is', $sqlContent, $indexMatches, PREG_SET_ORDER);
foreach ($indexMatches as $match) {
    $indexName = trim($match[1]);
    $tableName = trim($match[2]);
    $columns = trim($match[3]);
    $indexesExpected[] = [
        'name' => $indexName,
        'table' => $tableName,
        'columns' => $columns
    ];
}

// 2. Fetch actual schema from database
echo "<h2>1. Table & Column Verification</h2>";
foreach ($tablesExpected as $table => $expectedCols) {
    echo "<div class='card'>";
    echo "<h3>Table: $table</h3>";
    
    $stmt = $conn->prepare("SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
    $stmt->execute([$table]);
    $actualColsRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($actualColsRaw)) {
        echo "<span class='error'>MISSING TABLE: The entire table '$table' does not exist in the database!</span></div>";
        continue;
    }
    
    $actualCols = [];
    foreach ($actualColsRaw as $row) {
        $actualCols[$row['COLUMN_NAME']] = strtoupper($row['COLUMN_TYPE']);
    }
    
    echo "<table><tr><th>Column</th><th>Expected Type (approx)</th><th>Actual DB Type</th><th>Status</th></tr>";
    
    foreach ($expectedCols as $colName => $expectedType) {
        echo "<tr>";
        echo "<td><strong>$colName</strong></td>";
        echo "<td>$expectedType</td>";
        
        if (!isset($actualCols[$colName])) {
            echo "<td>---</td>";
            echo "<td class='error'>MISSING COLUMN</td>";
        } else {
            $actualType = $actualCols[$colName];
            echo "<td>$actualType</td>";
            
            // Basic fuzzy matching for types (since SQL definitions often differ slightly from INFORMATION_SCHEMA like INT vs INT(11))
            $isMatch = strpos($actualType, $expectedType) !== false || strpos($expectedType, $actualType) !== false;
            
            if (strpos($expectedType, 'INT') !== false && strpos($actualType, 'INT') !== false) $isMatch = true;
            if ($expectedType == 'BOOLEAN' && $actualType == 'TINYINT(1)') $isMatch = true;
            
            if ($isMatch) {
                echo "<td class='success'>OK</td>";
            } else {
                echo "<td class='warning'>Type Mismatch (Needs manual review)</td>";
            }
        }
        echo "</tr>";
    }
    echo "</table>";
    echo "</div>";
}

echo "<h2>2. Index Verification</h2>";
echo "<div class='card'>";
if (empty($indexesExpected)) {
    echo "No explicit performance indexes found in database.sql to check.";
} else {
    echo "<table><tr><th>Index Name</th><th>Table</th><th>Status</th></tr>";
    foreach ($indexesExpected as $idx) {
        $stmt = $conn->prepare("SHOW INDEXES FROM `" . $idx['table'] . "` WHERE Key_name = ?");
        $stmt->execute([$idx['name']]);
        $exists = $stmt->rowCount() > 0;
        
        echo "<tr>";
        echo "<td>{$idx['name']}</td>";
        echo "<td>{$idx['table']}</td>";
        if ($exists) {
            echo "<td class='success'>EXISTS</td>";
        } else {
            echo "<td class='error'>MISSING INDEX</td>";
        }
        echo "</tr>";
    }
    echo "</table>";
}
echo "</div>";

echo "</body></html>";
