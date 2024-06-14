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
    // Update movie parking
    $data = json_decode(file_get_contents("php://input"), true);
    $movie_id = intval($data['movie_id']);
    $parking_id = intval($data['parking_id']);
    $parking_code = $data['parking_code'];
    $date_id = intval($data['date_id']);
    $status = $data['status'];

    // Get start_time based on date_id
    $sql = "SELECT start_time FROM movie_date WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $date_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $movie_date = $result->fetch_assoc();
    $stmt->close();

    if ($movie_date) {
        $start_time = $movie_date['start_time'];

        $conn->begin_transaction();
        try {
            // Update status of the given record
            $sql = "UPDATE movie_parking SET status = ? WHERE movie_id = ? AND parking_id = ? AND parking_code = ? AND date_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sisii", $status, $movie_id, $parking_id, $parking_code, $date_id);
            $stmt->execute();
            $stmt->close();

            // Update status of other records with the same start_time
            $sql = "UPDATE movie_parking mp
                    JOIN movie_date md ON mp.date_id = md.id
                    SET mp.status = ?
                    WHERE mp.parking_code = ? AND md.start_time = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sss", $status, $parking_code, $start_time);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['message' => 'Movie parking updated successfully', 'status' => 'success', 'data' => null]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['message' => 'Movie parking update failed', 'status' => 'error', 'data' => null]);
        }
    } else {
        echo json_encode(['message' => 'Invalid date_id', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
