<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = ""; // your database password
$dbname = "savoy-db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['message' => 'Database connection failed', 'status' => 'error', 'data' => null]));
}

// Ensure it's a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get input data
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'];
    $username = $data['username'];
    $password = $data['password'];
    $user_level = $data['user_level'];

    // Check if email already exists
    $sql = "SELECT id FROM user WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(['message' => 'Email is already registered', 'status' => 'error', 'data' => null]);
        $stmt->close();
        $conn->close();
        exit();
    }
    $stmt->close();

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $sql = "INSERT INTO user (email, username, password, user_level) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $email, $username, $hashed_password, $user_level);
    if ($stmt->execute()) {
        $user_id = $stmt->insert_id;
        $response = [
            'id' => $user_id,
            'email' => $email,
            'username' => $username,
            'user_level' => $user_level
        ];
        echo json_encode(['message' => 'User registered successfully', 'status' => 'success', 'data' => $response]);
    } else {
        echo json_encode(['message' => 'User registration failed', 'status' => 'error', 'data' => null]);
    }

    $stmt->close();
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
