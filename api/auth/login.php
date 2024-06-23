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
    $password = $data['password'];

    // Check if email exists
    $sql = "SELECT id, username, email, password, user_level, first_name, last_name, phone FROM user WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(['message' => 'Email does not exist', 'status' => 'error', 'data' => null]);
        $stmt->close();
        $conn->close();
        exit();
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        echo json_encode(['message' => 'Incorrect password', 'status' => 'error', 'data' => null]);
        $stmt->close();
        $conn->close();
        exit();
    }

    // Remove password from response
    unset($user['password']);

    echo json_encode(['message' => 'Login successful', 'status' => 'success', 'data' => $user]);

    $stmt->close();
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
