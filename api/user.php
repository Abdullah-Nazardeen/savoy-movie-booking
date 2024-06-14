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
    if (isset($_GET['id'])) {
        // Get user by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, username, email, phone, last_name, first_name, user_level FROM user WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user) {
            echo json_encode(['message' => 'User retrieved successfully', 'status' => 'success', 'data' => $user]);
        } else {
            echo json_encode(['message' => 'User not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Check if any users exist
        $sql = "SELECT id FROM user";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            echo json_encode(['message' => 'Users exist in the database', 'status' => 'success', 'data' => null]);
        } else {
            echo json_encode(['message' => 'No users found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'PUT') {
    // Update user information
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $first_name = $data['first_name'];
    $last_name = $data['last_name'];
    $phone = $data['phone'];

    $sql = "UPDATE user SET first_name = ?, last_name = ?, phone = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssi", $first_name, $last_name, $phone, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'User updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'User update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete user by ID
        $id = intval($_GET['id']);
        $sql = "DELETE FROM user WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['message' => 'User deleted successfully', 'status' => 'success', 'data' => null]);
        } else {
            echo json_encode(['message' => 'User deletion failed', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        echo json_encode(['message' => 'User ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
