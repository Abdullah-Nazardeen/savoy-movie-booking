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
        // Get screen by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, name, seating_capacity, seating_code FROM screen WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $screen = $result->fetch_assoc();

        if ($screen) {
            echo json_encode(['message' => 'Screen retrieved successfully', 'status' => 'success', 'data' => $screen]);
        } else {
            echo json_encode(['message' => 'Screen not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } elseif (isset($_GET['screen_id']) && isset($_GET['start_time'])) {
        // Check if screen is booked
        $screen_id = intval($_GET['screen_id']);
        $start_time = $_GET['start_time'];

        $sql = "SELECT m.id FROM movie m JOIN movie_date md ON m.id = md.movie_id WHERE m.screen_id = ? AND md.start_time = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("is", $screen_id, $start_time);
        $stmt->execute();
        $result = $stmt->get_result();
        $is_booked = $result->num_rows > 0;
        $stmt->close();

        echo json_encode(['message' => 'Screen booking status retrieved', 'status' => 'success', 'data' => ['screen_booked' => $is_booked]]);
    } else {
        // Get all screens
        $sql = "SELECT id, name, seating_capacity, seating_code FROM screen";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $screens = [];
            while ($row = $result->fetch_assoc()) {
                $screens[] = $row;
            }
            echo json_encode(['message' => 'Screens retrieved successfully', 'status' => 'success', 'data' => $screens]);
        } else {
            echo json_encode(['message' => 'No screens found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new screen
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'];
    $seating_capacity = $data['seating_capacity'];
    $seating_code = $data['seating_code'];

    $sql = "INSERT INTO screen (name, seating_capacity, seating_code) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sis", $name, $seating_capacity, $seating_code);

    if ($stmt->execute()) {
        $screen_id = $stmt->insert_id;
        $response = ['id' => $screen_id, 'name' => $name, 'seating_capacity' => $seating_capacity, 'seating_code' => $seating_code];
        echo json_encode(['message' => 'Screen created successfully', 'status' => 'success', 'data' => $response]);
    } else {
        echo json_encode(['message' => 'Screen creation failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'PUT') {
    // Update screen
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $name = $data['name'];
    $seating_capacity = $data['seating_capacity'];
    $seating_code = $data['seating_code'];

    $sql = "UPDATE screen SET name = ?, seating_capacity = ?, seating_code = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sisi", $name, $seating_capacity, $seating_code, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Screen updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Screen update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete screen by ID
        $id = intval($_GET['id']);

        $sql = "DELETE FROM screen WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['message' => 'Screen deleted successfully', 'status' => 'success', 'data' => null]);
        } else {
            echo json_encode(['message' => 'Screen deletion failed', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        echo json_encode(['message' => 'Screen ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
