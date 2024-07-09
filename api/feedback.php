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
        // Get feedback by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, user_id, comment, email FROM feedback WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $feedback = $result->fetch_assoc();

        if ($feedback) {
            echo json_encode(['message' => 'Feedback retrieved successfully', 'status' => 'success', 'data' => $feedback]);
        } else {
            echo json_encode(['message' => 'Feedback not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all feedbacks
        $sql = "SELECT id, user_id, comment, email FROM feedback";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $feedbacks = [];
            while ($row = $result->fetch_assoc()) {
                $feedbacks[] = $row;
            }
            echo json_encode(['message' => 'Categories retrieved successfully', 'status' => 'success', 'data' => $feedbacks]);
        } else {
            echo json_encode(['message' => 'No feedbacks found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new feedback
    $data = json_decode(file_get_contents("php://input"), true);
    $comment = $data['comment'];
    $email = $data['email'];
    $userId = $data['user_id'];

    $sql = "INSERT INTO feedback (comment, email, user_id) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssi", $comment, $email, $userId);

    if ($stmt->execute()) {
        $feedback_id = $stmt->insert_id;
        $response = ['id' => $feedback_id, 'comment' => $comment];
        echo json_encode(['message' => 'Feedback created successfully', 'status' => 'success', 'data' => $response]);
    } else {
        echo json_encode(['message' => 'Feedback creation failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete feedback and related records
        $id = intval($_GET['id']);

        $conn->begin_transaction();
        try {
            $sql = "DELETE FROM feedback WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['message' => 'Feedback deleted successfully', 'status' => 'success', 'data' => null]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['message' => 'Feedback deletion failed', 'status' => 'error', 'data' => null]);
        }
    } else {
        echo json_encode(['message' => 'Feedback ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
