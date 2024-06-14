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
        // Get promotion by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, name, discount FROM promotion WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $promotion = $result->fetch_assoc();

        if ($promotion) {
            echo json_encode(['message' => 'Promotion retrieved successfully', 'status' => 'success', 'data' => $promotion]);
        } else {
            echo json_encode(['message' => 'Promotion not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all promotions
        $sql = "SELECT id, name, discount FROM promotion";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $promotions = [];
            while ($row = $result->fetch_assoc()) {
                $promotions[] = $row;
            }
            echo json_encode(['message' => 'Promotions retrieved successfully', 'status' => 'success', 'data' => $promotions]);
        } else {
            echo json_encode(['message' => 'No promotions found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new promotion
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'];
    $discount = $data['discount'];

    $sql = "INSERT INTO promotion (name, discount) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sd", $name, $discount);

    if ($stmt->execute()) {
        $promotion_id = $stmt->insert_id;
        $response = ['id' => $promotion_id, 'name' => $name, 'discount' => $discount];
        echo json_encode(['message' => 'Promotion created successfully', 'status' => 'success', 'data' => $response]);
    } else {
        echo json_encode(['message' => 'Promotion creation failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'PUT') {
    // Update promotion
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $name = $data['name'];
    $discount = $data['discount'];

    $sql = "UPDATE promotion SET name = ?, discount = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sdi", $name, $discount, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Promotion updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Promotion update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete promotion by ID
        $id = intval($_GET['id']);

        $sql = "DELETE FROM promotion WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['message' => 'Promotion deleted successfully', 'status' => 'success', 'data' => null]);
        } else {
            echo json_encode(['message' => 'Promotion deletion failed', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        echo json_encode(['message' => 'Promotion ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
