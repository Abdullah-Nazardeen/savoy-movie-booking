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

// Ensure it's a GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT id, username, email, phone, last_name, first_name, user_level FROM user WHERE user_level = 'customer'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $customers = [];
        while($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
        echo json_encode(['message' => 'Customers retrieved successfully', 'status' => 'success', 'data' => $customers]);
    } else {
        echo json_encode(['message' => 'No customers found', 'status' => 'error', 'data' => null]);
    }
} elseif ($method === 'PUT') {
    // Update existing staff user
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $first_name = isset($data['first_name']) ? $data['first_name'] : null;
    $last_name = isset($data['last_name']) ? $data['last_name'] : null;
    $phone = isset($data['phone']) ? $data['phone'] : null;

    $sql = "UPDATE user SET first_name = ?, last_name = ?, phone = ? WHERE id = ? AND user_level = 'customer'";
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
