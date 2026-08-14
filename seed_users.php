<?php
require_once __DIR__ . '/public/includes/db.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("Database connection failed\n");
}

$firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Aryan', 'Rudra', 'Ananya', 'Diya', 'Advaita', 'Myra', 'Saanvi', 'Kavya', 'Ahana', 'Anika', 'Aarohi', 'Pari', 'Zara', 'Avni', 'Riya', 'Aashi'];
$lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Mehta', 'Rao', 'Das', 'Roy', 'Kapoor', 'Chopra', 'Yadav', 'Joshi', 'Nair', 'Pillai', 'Bhat', 'Chatterjee', 'Iyer'];
$interestsList = ['Backend Development', 'Music', 'Running', 'UX/UI', 'React', 'Node.js', 'Machine Learning', 'Cybersecurity', 'Cloud Computing', 'Photography', 'Reading', 'Chess', 'Basketball'];
$roles = ['member', 'faculty', 'admin'];
$currentYear = (int)date('Y');
$maxBatch = $currentYear + 4;
$batches = range(2027, $maxBatch);
$groups = ['A', 'B', 'C', 'D'];

echo "Starting seeding...\n";

for ($i = 0; $i < 25; $i++) {
    $firstName = $firstNames[array_rand($firstNames)];
    $lastName = $lastNames[array_rand($lastNames)];
    $name = $firstName . ' ' . $lastName;
    
    // Generate unique email and rollno
    $email = strtolower($firstName) . '.' . strtolower($lastName) . $i . '@scaler.com';
    $rollno = 'SST' . rand(2023, 2026) . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    
    // Generate interests
    $userInterests = [];
    $numInterests = rand(1, 4);
    $shuffledInterests = $interestsList;
    shuffle($shuffledInterests);
    for ($j = 0; $j < $numInterests; $j++) {
        $userInterests[] = $shuffledInterests[$j];
    }
    
    $type = (rand(1, 10) > 8) ? 'faculty' : 'member'; // 20% faculty
    
    $extra = [
        "description" => "Hello! I am $name. I love coding and exploring new technologies.",
        "social" => [
            "github" => strtolower($firstName) . rand(1, 99),
            "portfolio" => "https://" . strtolower($firstName) . ".com",
            "instagram" => "",
            "linkedin" => "",
            "hackerone" => ""
        ],
        "clubs" => ["nlogn" => ""],
        "research" => ["orcid" => ""],
        "interests" => $userInterests,
        "disable_public_profile" => false
    ];
    
    // Avatar styles
    $styles = ['avataaars', 'bottts', 'fun-emoji', 'micah', 'pixel-art'];
    $style = $styles[array_rand($styles)];
    $avatar = "https://api.dicebear.com/7.x/{$style}/svg?seed=" . urlencode($name);
    
    $batch = $batches[array_rand($batches)];
    $group = $groups[array_rand($groups)];
    
    try {
        $conn->beginTransaction();
        
        // Insert into users
        $stmt1 = $conn->prepare("INSERT INTO users (email, sso) VALUES (?, 1)");
        $stmt1->execute([$email]);
        $user_id = $conn->lastInsertId();
        
        // Insert into userdata
        $stmt2 = $conn->prepare("
            INSERT INTO userdata (user_id, name, rollno, avatar, batch, `group`, type, status, extra)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
        ");
        $stmt2->execute([
            $user_id,
            $name,
            $rollno,
            $avatar,
            $batch,
            $group,
            $type,
            json_encode($extra)
        ]);
        
        $conn->commit();
        echo "Inserted user: $name ($email)\n";
    } catch (Exception $e) {
        $conn->rollBack();
        echo "Failed to insert $name: " . $e->getMessage() . "\n";
    }
}

echo "Seeding completed!\n";
