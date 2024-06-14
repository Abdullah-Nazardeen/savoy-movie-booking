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

if ($method === 'POST') {
    // Create new ticket
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = intval($data['user_id']);
    $movie_id = intval($data['movie_id']);
    $status = $data['status'];
    $final_price = $data['final_price'];
    $date = $data['date'];
    $date_id = intval($data['date_id']);
    $seat_codes = $data['seat_codes'];
    $parking_codes = $data['parking_codes'];

    $conn->begin_transaction();
    try {
        // Insert into ticket table
        $sql = "INSERT INTO ticket (user_id, movie_id, status, final_price, date) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iisss", $user_id, $movie_id, $status, $final_price, $date);
        $stmt->execute();
        $ticket_id = $stmt->insert_id;
        $stmt->close();

        // Update movie_seating records
        foreach ($seat_codes as $seat_code) {
            $sql = "UPDATE movie_seating SET ticket_id = ?, status = 'booked' WHERE movie_id = ? AND screen_id = (SELECT screen_id FROM movie WHERE id = ?) AND date_id = ? AND seat_code = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiiss", $ticket_id, $movie_id, $movie_id, $date_id, $seat_code);
            $stmt->execute();
            $stmt->close();
        }

        // Update movie_parking records
        foreach ($parking_codes as $parking_code) {
            // Update main parking record
            $sql = "UPDATE movie_parking SET ticket_id = ?, status = 'booked' WHERE movie_id = ? AND date_id = ? AND parking_code = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiis", $ticket_id, $movie_id, $date_id, $parking_code);
            $stmt->execute();
            $stmt->close();

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

                // Update other parking records with the same start_time
                $sql = "UPDATE movie_parking mp
                        JOIN movie_date md ON mp.date_id = md.id
                        SET mp.status = 'booked'
                        WHERE mp.parking_code = ? AND md.start_time = ? AND mp.ticket_id IS NULL";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ss", $parking_code, $start_time);
                $stmt->execute();
                $stmt->close();
            }
        }

        $conn->commit();
        echo json_encode(['message' => 'Ticket created successfully', 'status' => 'success', 'data' => ['id' => $ticket_id]]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['message' => 'Ticket creation failed', 'status' => 'error', 'data' => null]);
    }
} elseif ($method === 'PUT') {
    // Update ticket status
    $data = json_decode(file_get_contents("php://input"), true);
    $ticket_id = intval($data['id']);
    $status = $data['status'];

    $conn->begin_transaction();
    try {
        // Update ticket status
        $sql = "UPDATE ticket SET status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $status, $ticket_id);
        $stmt->execute();
        $stmt->close();

        if ($status === 'rejected') {
            // Update movie_seating records
            $sql = "UPDATE movie_seating SET status = 'not booked' WHERE ticket_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $ticket_id);
            $stmt->execute();
            $stmt->close();

            // Update movie_parking records
            $sql = "SELECT id, start_time FROM movie_date WHERE id IN (SELECT date_id FROM movie_parking WHERE ticket_id = ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $ticket_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $start_times = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            foreach ($start_times as $time) {
                $start_time = $time['start_time'];

                // Update main parking records
                $sql = "UPDATE movie_parking SET status = 'not booked' WHERE ticket_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $ticket_id);
                $stmt->execute();
                $stmt->close();

                // Update other parking records with the same start_time
                $sql = "UPDATE movie_parking mp
                        JOIN movie_date md ON mp.date_id = md.id
                        SET mp.status = 'not booked'
                        WHERE md.start_time = ? AND mp.ticket_id IS NULL";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $start_time);
                $stmt->execute();
                $stmt->close();
            }
        }

        $conn->commit();
        echo json_encode(['message' => 'Ticket status updated successfully', 'status' => 'success', 'data' => null]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['message' => 'Ticket status update failed', 'status' => 'error', 'data' => null]);
    }
} elseif ($method === 'GET') {
    if (isset($_GET['id'])) {
        // Get ticket by ID
        $id = intval($_GET['id']);
        $sql = "SELECT * FROM ticket WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $ticket = $result->fetch_assoc();

        if ($ticket) {
            echo json_encode(['message' => 'Ticket retrieved successfully', 'status' => 'success', 'data' => $ticket]);
        } else {
            echo json_encode(['message' => 'Ticket not found', 'status' => 'error', 'data' => null]);
        }
        $stmt->close();
    } else {
        // Get all tickets
        $sql = "SELECT * FROM ticket";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $tickets = [];
            while ($row = $result->fetch_assoc()) {
                $tickets[] = $row;
            }
            echo json_encode(['message' => 'Tickets retrieved successfully', 'status' => 'success', 'data' => $tickets]);
        } else {
            echo json_encode(['message' => 'No tickets found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        // Delete ticket by ID
        $id = intval($_GET['id']);

        $conn->begin_transaction();
        try {
            // Update movie_seating records
            $sql = "UPDATE movie_seating SET ticket_id = NULL, status = 'not booked' WHERE ticket_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            // Update movie_parking records
            $sql = "SELECT id, start_time FROM movie_date WHERE id IN (SELECT date_id FROM movie_parking WHERE ticket_id = ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $start_times = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            foreach ($start_times as $time) {
                $start_time = $time['start_time'];

                // Update main parking records
                $sql = "UPDATE movie_parking SET ticket_id = NULL, status = 'not booked' WHERE ticket_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $stmt->close();

                // Update other parking records with the same start_time
                $sql = "UPDATE movie_parking mp
                        JOIN movie_date md ON mp.date_id = md.id
                        SET mp.status = 'not booked'
                        WHERE md.start_time = ? AND mp.ticket_id IS NULL";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $start_time);
                $stmt->execute();
                $stmt->close();
            }

            // Delete ticket record
            $sql = "DELETE FROM ticket WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['message' => 'Ticket deleted successfully', 'status' => 'success', 'data' => null]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['message' => 'Ticket deletion failed', 'status' => 'error', 'data' => null]);
        }
    } else {
        echo json_encode(['message' => 'Ticket ID not provided', 'status' => 'error', 'data' => null]);
    }
} else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
?>
