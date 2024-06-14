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
        // Get parking by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, name, parking_capacity, code FROM parking WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $parking = $result->fetch_assoc();

        if ($parking) {
            echo json_encode(['message' => 'Parking retrieved successfully', 'status' => 'success', 'data' => $parking]);
        } else {
            echo json_encode(['message' => 'Parking not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all parkings
        $sql = "SELECT id, name, parking_capacity, code FROM parking";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $parkings = [];
            while ($row = $result->fetch_assoc()) {
                $parkings[] = $row;
            }
            echo json_encode(['message' => 'Parkings retrieved successfully', 'status' => 'success', 'data' => $parkings]);
        } else {
            echo json_encode(['message' => 'No parkings found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new parking
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'];
    $parking_capacity = $data['parking_capacity'];
    $code = $data['code'];

    $sql = "INSERT INTO parking (name, parking_capacity, code) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sis", $name, $parking_capacity, $code);

    if ($stmt->execute()) {
        $parking_id = $stmt->insert_id;
        $response = ['id' => $parking_id, 'name' => $name, 'parking_capacity' => $parking_capacity, 'code' => $code];
        echo json_encode(['message' => 'Parking created successfully', 'status' => 'success', 'data' => $response]);
    } else {
        echo json_encode(['message' => 'Parking creation failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'PUT') {
    // Update parking
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $name = $data['name'];
    $parking_capacity = $data['parking_capacity'];
    $code = $data['code'];

    $sql = "UPDATE parking SET name = ?, parking_capacity = ?, code = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sisi", $name, $parking_capacity, $code, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Parking updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Parking update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete parking by ID
        $id = intval($_GET['id']);

        $sql = "DELETE FROM parking WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['message' => 'Parking deleted successfully', 'status' => 'success', 'data' => null]);
        } else {
            echo json_encode(['message' => 'Parking deletion failed', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        echo json_encode(['message' => 'Parking ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
