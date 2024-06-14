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

if ($method === 'PUT') {
    // Update movie seating
    $data = json_decode(file_get_contents("php://input"), true);
    $movie_id = intval($data['movie_id']);
    $seat_code = $data['seat_code'];
    $screen_id = intval($data['screen_id']);
    $status = $data['status'];

    $sql = "UPDATE movie_seating SET status = ? WHERE movie_id = ? AND seat_code = ? AND screen_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sisi", $status, $movie_id, $seat_code, $screen_id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Movie seating updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Movie seating update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
