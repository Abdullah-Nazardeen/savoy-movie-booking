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

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Retrieve staff users
    $sql = "SELECT id, username, email, phone, last_name, first_name, user_level FROM user WHERE user_level = 'staff'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $staff = [];
        while ($row = $result->fetch_assoc()) {
            $staff[] = $row;
        }
        echo json_encode(['message' => 'Staff retrieved successfully', 'status' => 'success', 'data' => $staff]);
    } else {
        echo json_encode(['message' => 'No staff found', 'status' => 'error', 'data' => null]);
    }
} elseif ($method === 'POST') {
    // Create new staff user
    $data = json_decode(file_get_contents("php://input"), true);
    $username = $data['username'];
    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_BCRYPT);
    $first_name = isset($data['first_name']) ? $data['first_name'] : null;
    $last_name = isset($data['last_name']) ? $data['last_name'] : null;
    $phone = isset($data['phone']) ? $data['phone'] : null;
    $user_level = 'staff';
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    // Check if the email already exists
    $sql = "SELECT id FROM user WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(['message' => 'Email is already registered', 'status' => 'error', 'data' => null]);
        $stmt->close();
    } else {
        $stmt->close();

        // Insert the new staff user
        $sql = "INSERT INTO user (username, email, password, first_name, last_name, phone, user_level) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssss", $username, $email, $hashed_password, $first_name, $last_name, $phone, $user_level);

        if ($stmt->execute()) {
            $user_id = $stmt->insert_id;
            $response = ['id' => $user_id, 'username' => $username, 'email' => $email, 'first_name' => $first_name, 'last_name' => $last_name, 'phone' => $phone, 'user_level' => $user_level];
            echo json_encode(['message' => 'Staff user created successfully', 'status' => 'success', 'data' => $response]);
        } else {
            echo json_encode(['message' => 'Staff user creation failed', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    }
} elseif ($method === 'PUT') {
    // Update existing staff user
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $first_name = isset($data['first_name']) ? $data['first_name'] : null;
    $last_name = isset($data['last_name']) ? $data['last_name'] : null;
    $phone = isset($data['phone']) ? $data['phone'] : null;

    $sql = "UPDATE user SET first_name = ?, last_name = ?, phone = ? WHERE id = ? AND user_level = 'staff'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssi", $first_name, $last_name, $phone, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Staff user updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Staff user update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
