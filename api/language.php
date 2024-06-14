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
        // Get language by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, name FROM language WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $language = $result->fetch_assoc();

        if ($language) {
            echo json_encode(['message' => 'Language retrieved successfully', 'status' => 'success', 'data' => $language]);
        } else {
            echo json_encode(['message' => 'Language not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all languages
        $sql = "SELECT id, name FROM language";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $languages = [];
            while ($row = $result->fetch_assoc()) {
                $languages[] = $row;
            }
            echo json_encode(['message' => 'Languages retrieved successfully', 'status' => 'success', 'data' => $languages]);
        } else {
            echo json_encode(['message' => 'No languages found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new language
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'];

    $sql = "INSERT INTO language (name) VALUES (?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $name);

    if ($stmt->execute()) {
        $language_id = $stmt->insert_id;
        $response = ['id' => $language_id, 'name' => $name];
        echo json_encode(['message' => 'Language created successfully', 'status' => 'success', 'data' => $response]);
    } else {
        echo json_encode(['message' => 'Language creation failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'PUT') {
    // Update language
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $name = $data['name'];

    $sql = "UPDATE language SET name = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $name, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Language updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Language update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete language and related records
        $id = intval($_GET['id']);

        $conn->begin_transaction();
        try {
            $sql = "DELETE FROM movie_language WHERE language_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $sql = "DELETE FROM language WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['message' => 'Language deleted successfully', 'status' => 'success', 'data' => null]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['message' => 'Language deletion failed', 'status' => 'error', 'data' => null]);
        }
    } else {
        echo json_encode(['message' => 'Language ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
