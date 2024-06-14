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
        // Get category by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, name FROM category WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $category = $result->fetch_assoc();

        if ($category) {
            echo json_encode(['message' => 'Category retrieved successfully', 'status' => 'success', 'data' => $category]);
        } else {
            echo json_encode(['message' => 'Category not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all categories
        $sql = "SELECT id, name FROM category";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $categories = [];
            while ($row = $result->fetch_assoc()) {
                $categories[] = $row;
            }
            echo json_encode(['message' => 'Categories retrieved successfully', 'status' => 'success', 'data' => $categories]);
        } else {
            echo json_encode(['message' => 'No categories found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new category
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'];

    $sql = "INSERT INTO category (name) VALUES (?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $name);

    if ($stmt->execute()) {
        $category_id = $stmt->insert_id;
        $response = ['id' => $category_id, 'name' => $name];
        echo json_encode(['message' => 'Category created successfully', 'status' => 'success', 'data' => $response]);
    } else {
        echo json_encode(['message' => 'Category creation failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'PUT') {
    // Update category
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $name = $data['name'];

    $sql = "UPDATE category SET name = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $name, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Category updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Category update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete category and related records
        $id = intval($_GET['id']);

        $conn->begin_transaction();
        try {
            $sql = "DELETE FROM movie_category WHERE category_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $sql = "DELETE FROM category WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['message' => 'Category deleted successfully', 'status' => 'success', 'data' => null]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['message' => 'Category deletion failed', 'status' => 'error', 'data' => null]);
        }
    } else {
        echo json_encode(['message' => 'Category ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
