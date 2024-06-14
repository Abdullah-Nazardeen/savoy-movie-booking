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
        // Get actor by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, name, image FROM actor WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $actor = $result->fetch_assoc();

        if ($actor) {
            echo json_encode(['message' => 'Actor retrieved successfully', 'status' => 'success', 'data' => $actor]);
        } else {
            echo json_encode(['message' => 'Actor not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all actors
        $sql = "SELECT id, name, image FROM actor";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $actors = [];
            while ($row = $result->fetch_assoc()) {
                $row['image'] = base64_encode($row['image']);
                $actors[] = $row;
            }
            echo json_encode(['message' => 'Actors retrieved successfully', 'status' => 'success', 'data' => $actors]);
        } else {
            echo json_encode(['message' => 'No actors found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new actor

    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $name = $_POST['name'];
        $image = null;
        if (isset($_FILES['image']) && $_FILES['image']['size'] > 0) {
            $image = file_get_contents($_FILES['image']['tmp_name']);
        }

        if ($id > 0 && $name !== '') {
            if ($image !== null) {
                $sql = "UPDATE actor SET name = ?, image = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("sbi", $name, $null, $id);
                $stmt->send_long_data(1, $image);
            } else {
                $sql = "UPDATE actor SET name = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("si", $name, $id);
            }

            if ($stmt->execute()) {
                echo json_encode(['message' => 'Actor updated successfully', 'status' => 'success', 'data' => null]);
            } else {
                echo json_encode(['message' => 'Actor update failed', 'status' => 'error', 'data' => null]);
            }
            $stmt->close();
        } else {
            echo json_encode(['message' => 'Invalid data provided', 'status' => 'error', 'data' => null]);
        }
    } else {
        $name = $_POST['name'];
        $image = null;
        if (isset($_FILES['image']) && $_FILES['image']['size'] > 0) {
            $image = file_get_contents($_FILES['image']['tmp_name']);
        }


        error_log("POST Request - Name: " . $name);
        error_log("POST Request - Image FILES: " . $image);

        $sql = "INSERT INTO actor (name, image) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sb", $name, $null);
        if ($image !== null) {
            $stmt->send_long_data(1, $image);
        } else {
            $stmt->send_long_data(1, '');
        }

        if ($stmt->execute()) {
            $actor_id = $stmt->insert_id;
            $response = ['id' => $actor_id, 'name' => $name, 'image' => base64_encode($image)];
            echo json_encode(['message' => 'Actor created successfully', 'status' => 'success', 'data' => $response]);
        } else {
            echo json_encode(['message' => 'Actor creation failed', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    }
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete actor and related records
        $id = intval($_GET['id']);

        $conn->begin_transaction();
        try {
            $sql = "DELETE FROM movie_actor WHERE actor_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $sql = "DELETE FROM actor WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['message' => 'Actor deleted successfully', 'status' => 'success', 'data' => null]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['message' => 'Actor deletion failed', 'status' => 'error', 'data' => null]);
        }
    } else {
        echo json_encode(['message' => 'Actor ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
