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
        // Get payment by ID
        $id = intval($_GET['id']);
        $sql = "SELECT id, name, cvv, bank_no, type, expire_date FROM payment WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $payment = $result->fetch_assoc();

        if ($payment) {
            echo json_encode(['message' => 'Payment retrieved successfully', 'status' => 'success', 'data' => $payment]);
        } else {
            echo json_encode(['message' => 'Payment not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all payments
        $sql = "SELECT id, name, cvv, bank_no, type, expire_date FROM payment";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $payments = [];
            while ($row = $result->fetch_assoc()) {
                $payments[] = $row;
            }
            echo json_encode(['message' => 'Payments retrieved successfully', 'status' => 'success', 'data' => $payments]);
        } else {
            echo json_encode(['message' => 'No payments found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    // Create new payment
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'];
    $cvv = $data['cvv'];
    $bank_no = $data['bank_no'];
    $type = $data['type'];
    $expire_date = $data['expire_date'];
    $user_id = intval($data['user_id']);

    $conn->begin_transaction();
    try {
        // Insert into payment table
        $sql = "INSERT INTO payment (name, cvv, bank_no, type, expire_date) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssss", $name, $cvv, $bank_no, $type, $expire_date);
        $stmt->execute();
        $payment_id = $stmt->insert_id;
        $stmt->close();

        // Update user table with payment_id
        $sql = "UPDATE user SET payment_id = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $payment_id, $user_id);
        $stmt->execute();
        $stmt->close();

        $conn->commit();
        $response = ['id' => $payment_id, 'name' => $name, 'cvv' => $cvv, 'bank_no' => $bank_no, 'type' => $type, 'expire_date' => $expire_date];
        echo json_encode(['message' => 'Payment created and user updated successfully', 'status' => 'success', 'data' => $response]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['message' => 'Payment creation or user update failed', 'status' => 'error', 'data' => null]);
    }
} elseif ($method === 'PUT') {
    // Update payment
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $name = $data['name'];
    $cvv = $data['cvv'];
    $bank_no = $data['bank_no'];
    $type = $data['type'];
    $expire_date = $data['expire_date'];

    $sql = "UPDATE payment SET name = ?, cvv = ?, bank_no = ?, type = ?, expire_date = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssi", $name, $cvv, $bank_no, $type, $expire_date, $id);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Payment updated successfully', 'status' => 'success', 'data' => null]);
    } else {
        echo json_encode(['message' => 'Payment update failed', 'status' => 'error', 'data' => null]);
    }
    $stmt->close();
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete payment by ID
        $id = intval($_GET['id']);

        $sql = "DELETE FROM payment WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['message' => 'Payment deleted successfully', 'status' => 'success', 'data' => null]);
        } else {
            echo json_encode(['message' => 'Payment deletion failed', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        echo json_encode(['message' => 'Payment ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
