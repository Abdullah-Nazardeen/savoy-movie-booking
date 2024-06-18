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

function get_movie_details($conn, $id, $date_id = null)
{
    $sql = "SELECT id, name, price, description, duration, image, screen_id, promotion_id, language_id FROM movie WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $movie = $result->fetch_assoc();
    $stmt->close();

    if ($movie) {
        // Get screen details
        
        if ($movie['image']) {
            $movie['image'] = base64_encode($movie['image']);
        }
        
        $sql = "SELECT id, name, seating_capacity, seating_code FROM screen WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $movie['screen_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $movie['screen'] = $result->fetch_assoc();
        $stmt->close();

        // Get promotion details if exists
        if ($movie['promotion_id']) {
            $sql = "SELECT id, name, discount FROM promotion WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $movie['promotion_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $movie['promotion'] = $result->fetch_assoc();
            $stmt->close();
        }

        // Get categories
        $sql = "SELECT c.id, c.name FROM category c JOIN movie_category mc ON c.id = mc.category_id WHERE mc.movie_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $movie['categories'] = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // Get actors
        $sql = "SELECT a.id, a.name, a.image FROM actor a JOIN movie_actor ma ON a.id = ma.actor_id WHERE ma.movie_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $actors = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        foreach ($actors as &$actor) {
            if ($actor['image']) {
                $actor['image'] = base64_encode($actor['image']);
            }
        }

        $movie['actors'] = $actors;

        // Get languages
        $sql = "SELECT id, name FROM language WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $movie['language_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $movie['languages'] = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // Get dates
        $sql = "SELECT id, start_time, end_time FROM movie_date WHERE movie_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $movie['dates'] = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // Get seating if date_id is provided
        if ($date_id) {
            $sql = "SELECT seat_code, status, ticket_id FROM movie_seating WHERE movie_id = ? AND date_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $date_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $movie['seating'] = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            // Get parking if date_id is provided
            $sql = "SELECT parking_code, status, ticket_id FROM movie_parking WHERE movie_id = ? AND date_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $date_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $movie['parking'] = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
        }
    }
    error_log("MOVIE ID: " . $id . " MOVIE DATA: " . print_r($movie, true));
    return $movie;
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        // Get movie by ID
        $id = intval($_GET['id']);
        $date_id = isset($_GET['date_id']) ? intval($_GET['date_id']) : null;
        $movie = get_movie_details($conn, $id, $date_id);

        if ($movie) {
            echo json_encode(['message' => 'Movie retrieved successfully', 'status' => 'success', 'data' => $movie]);
        } else {
            echo json_encode(['message' => 'Movie not found', 'status' => 'error', 'data' => null]);
        }
    } else {
        // Get all movies
        $sql = "SELECT id FROM movie";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $movies = [];
            while ($row = $result->fetch_assoc()) {
                $movies[] = get_movie_details($conn, $row['id'], null);
            }
            echo json_encode(['message' => 'Movies retrieved successfully', 'status' => 'success', 'data' => $movies]);
        } else {
            echo json_encode(['message' => 'No movies found', 'status' => 'error', 'data' => null]);
        }
    }
} elseif ($method === 'POST') {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $name = $_POST['name'];
        $price = $_POST['price'];
        $description = $_POST['description'];
        $duration = $_POST['duration'];
        $screen_id = $_POST['screen_id'];
        $language_id = $_POST['language_id'];
        $promotion_id = isset($_POST['promotion_id']) ? $_POST['promotion_id'] : null;
        $category_ids = isset($_POST['category_ids']) ? explode(',', $_POST['category_ids']) : [];
        $actor_ids = isset($_POST['actor_ids']) ? explode(',', $_POST['actor_ids']) : [];
        $dates = isset($_POST['dates']) ? json_decode($_POST['dates'], true) : [];
        $image = null;

        if (isset($_FILES['image']) && $_FILES['image']['size'] > 0) {
            $image = file_get_contents($_FILES['image']['tmp_name']);
        }

        if ($id > 0 && $name !== '') {
            $conn->begin_transaction();
            try {
                if ($image !== null) {
                    $sql = "UPDATE movie SET name = ?, price = ?, description = ?, duration = ?, image = ?, screen_id = ?, promotion_id = ?, language_id = ? WHERE id = ?";
                    $stmt = $conn->prepare($sql);
                    $null = NULL;
                    $stmt->bind_param("sdssbsiii", $name, $price, $description, $duration, $null, $screen_id, $promotion_id, $language_id, $id);
                    $stmt->send_long_data(4, $image);
                } else {
                    $sql = "UPDATE movie SET name = ?, price = ?, description = ?, duration = ?, screen_id = ?, promotion_id = ?, language_id = ? WHERE id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("sdssiiii", $name, $price, $description, $duration, $screen_id, $promotion_id, $language_id, $id);
                }

                $stmt->execute();
                $stmt->close();

                // Update movie categories
                $existing_category_ids = [];
                $sql = "SELECT category_id FROM movie_category WHERE movie_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $existing_category_ids[] = $row['category_id'];
                }
                $stmt->close();

                $new_category_ids = array_diff($category_ids, $existing_category_ids);
                $removed_category_ids = array_diff($existing_category_ids, $category_ids);

                foreach ($new_category_ids as $category_id) {
                    $sql = "INSERT INTO movie_category (movie_id, category_id) VALUES (?, ?)";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("ii", $id, $category_id);
                    $stmt->execute();
                    $stmt->close();
                }

                foreach ($removed_category_ids as $category_id) {
                    $sql = "DELETE FROM movie_category WHERE movie_id = ? AND category_id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("ii", $id, $category_id);
                    $stmt->execute();
                    $stmt->close();
                }

                // Update movie actors
                $existing_actor_ids = [];
                $sql = "SELECT actor_id FROM movie_actor WHERE movie_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $existing_actor_ids[] = $row['actor_id'];
                }
                $stmt->close();

                $new_actor_ids = array_diff($actor_ids, $existing_actor_ids);
                $removed_actor_ids = array_diff($existing_actor_ids, $actor_ids);

                foreach ($new_actor_ids as $actor_id) {
                    $sql = "INSERT INTO movie_actor (movie_id, actor_id) VALUES (?, ?)";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("ii", $id, $actor_id);
                    $stmt->execute();
                    $stmt->close();
                }

                foreach ($removed_actor_ids as $actor_id) {
                    $sql = "DELETE FROM movie_actor WHERE movie_id = ? AND actor_id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("ii", $id, $actor_id);
                    $stmt->execute();
                    $stmt->close();
                }

                // Update movie dates
                $existing_date_ids = [];
                $sql = "SELECT id FROM movie_date WHERE movie_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $existing_date_ids[] = $row['id'];
                }
                $stmt->close();

                $incoming_date_ids = array_column($dates, 'id');
                $new_dates = array_filter($dates, fn ($date) => !isset($date['id']) || $date['id'] === '');
                $existing_dates = array_filter($dates, fn ($date) => isset($date['id']));
                $removed_date_ids = array_diff($existing_date_ids, $incoming_date_ids);

                foreach ($new_dates as $date) {
                    $start_time = $date['start_time'];
                    $end_time = $date['end_time'];
                    $sql = "INSERT INTO movie_date (movie_id, start_time, end_time) VALUES (?, ?, ?)";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iss", $id, $start_time, $end_time);
                    $stmt->execute();
                    $stmt->close();
                }

                foreach ($existing_dates as $date) {
                    $date_id = $date['id'];
                    $start_time = $date['start_time'];
                    $end_time = $date['end_time'];
                    $sql = "UPDATE movie_date SET start_time = ?, end_time = ? WHERE id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("ssi", $start_time, $end_time, $date_id);
                    $stmt->execute();
                    $stmt->close();
                }

                foreach ($removed_date_ids as $date_id) {
                    $sql = "DELETE FROM movie_date WHERE id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("i", $date_id);
                    $stmt->execute();
                    $stmt->close();
                }

                $conn->commit();
                echo json_encode(['message' => 'Movie updated successfully', 'status' => 'success', 'data' => null]);
            } catch (Exception $e) {
                $conn->rollback();
                echo json_encode(['message' => 'Movie update failed', 'status' => 'error', 'data' => null, 'error' => $e->getMessage()]);
            }
        } else {
            echo json_encode(['message' => 'Invalid data provided', 'status' => 'error', 'data' => null]);
        }
    } else {
        $name = $_POST['name'];
        $price = $_POST['price'];
        $duration = $_POST['duration'];
        $description = $_POST['description'];
        $screen_id = $_POST['screen_id'];
        $language_id = $_POST['language_id'];
        $promotion_id = isset($_POST['promotion_id']) ? $_POST['promotion_id'] : null;
        $category_ids = isset($_POST['category_ids']) ? explode(',', $_POST['category_ids']) : [];
        $actor_ids = isset($_POST['actor_ids']) ? explode(',', $_POST['actor_ids']) : [];
        $dates = isset($_POST['dates']) ? json_decode($_POST['dates'], true) : [];
        $image = null;

        if (isset($_FILES['image']) && $_FILES['image']['size'] > 0) {
            $image = file_get_contents($_FILES['image']['tmp_name']);
        }

        $conn->begin_transaction();
        try {
            if ($image !== null) {
                error_log("IMAGE FILE ========= " . $_FILES['image']['tmp_name']);
                $sql = "INSERT INTO movie (name, price, description, duration, image, screen_id, promotion_id, language_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $null = NULL;
                $stmt->bind_param("sdssbiii", $name, $price, $description, $duration, $null, $screen_id, $promotion_id, $language_id);
                $stmt->send_long_data(4, $image);
            } else {
                $sql = "INSERT INTO movie (name, price, description, duration, screen_id, promotion_id, language_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("sdssiii", $name, $price, $description, $duration, $screen_id, $promotion_id, $language_id);
            }

            $stmt->execute();
            $movie_id = $stmt->insert_id;
            $stmt->close();

            // Insert movie categories
            foreach ($category_ids as $category_id) {
                $sql = "INSERT INTO movie_category (movie_id, category_id) VALUES (?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ii", $movie_id, $category_id);
                $stmt->execute();
                $stmt->close();
            }

            // Insert movie actors
            foreach ($actor_ids as $actor_id) {
                $sql = "INSERT INTO movie_actor (movie_id, actor_id) VALUES (?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ii", $movie_id, $actor_id);
                $stmt->execute();
                $stmt->close();
            }

            // Insert movie dates and seating
            foreach ($dates as $date) {
                $start_time = (new DateTime($date['start_time']))->format('Y-m-d H:i:s');
                $end_time = (new DateTime($date['end_time']))->format('Y-m-d H:i:s');

                // Insert movie date
                $sql = "INSERT INTO movie_date (movie_id, start_time, end_time) VALUES (?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iss", $movie_id, $start_time, $end_time);
                $stmt->execute();
                $date_id = $stmt->insert_id;
                $stmt->close();

                // Get seating capacity and code
                $sql = "SELECT seating_capacity, seating_code FROM screen WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $screen_id);
                $stmt->execute();
                $stmt->bind_result($seating_capacity, $seating_code);
                $stmt->fetch();
                $stmt->close();

                // Insert movie seating
                for ($i = 1; $i <= $seating_capacity; $i++) {
                    $seat_code = $seating_code . '-' . $i;
                    $sql = "INSERT INTO movie_seating (movie_id, screen_id, seat_code, date_id, status) VALUES (?, ?, ?, ?, 'not_booked')";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iisi", $movie_id, $screen_id, $seat_code, $date_id);
                    $stmt->execute();
                    $stmt->close();
                }

                // Get parking capacity and code
                $sql = "SELECT id, parking_capacity, code FROM parking LIMIT 1";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $stmt->bind_result($parking_id, $parking_capacity, $parking_code);
                $stmt->fetch();
                $stmt->close();

                // Insert movie parking
                for ($i = 1; $i <= $parking_capacity; $i++) {
                    $parking_slot_code = $parking_code . '-' . $i;

                    // Check if the parking slot is already booked
                    $sql = "SELECT status FROM movie_parking mp JOIN movie_date md ON mp.date_id = md.id WHERE mp.movie_id = ? AND mp.parking_code = ? AND md.start_time = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iss", $movie_id, $parking_slot_code, $start_time);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $existing_parking = $result->fetch_assoc();
                    $stmt->close();

                    $status = 'not_booked';
                    if ($existing_parking && $existing_parking['status'] === 'booked') {
                        $status = 'booked';
                    }

                    $sql = "INSERT INTO movie_parking (movie_id, parking_id, parking_code, date_id, status) VALUES (?, ?, ?, ?, ?)";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iisis", $movie_id, $parking_id, $parking_slot_code, $date_id, $status);
                    $stmt->execute();
                    $stmt->close();
                }
            }

            $conn->commit();
            echo json_encode(['message' => 'Movie created successfully', 'status' => 'success', 'data' => ['id' => $movie_id]]);
        } catch (Exception $e) {
            $conn->rollback();
            error_log($e->getMessage(), 3, 'error_log.txt');
            echo json_encode(['message' => 'Movie creation failed', 'status' => 'error', 'data' => null, 'error' => $e->getMessage()]);
        }
    }
} elseif ($method === 'PUT') {
    // Update movie
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $name = $data['name'];
    $price = $data['price'];
    $duration = $data['duration'];
    $image = $data['image'];
    $screen_id = $data['screen_id'];
    $promotion_id = isset($data['promotion_id']) ? $data['promotion_id'] : null;
    $category_ids = $data['category_ids'];
    $actor_ids = $data['actor_ids'];
    $language_ids = $data['language_ids'];
    $dates = $data['dates'];

    $conn->begin_transaction();
    try {
        // Update movie details
        $sql = "UPDATE movie SET name = ?, price = ?, duration = ?, image = ?, screen_id = ?, promotion_id = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sdssiii", $name, $price, $duration, $image, $screen_id, $promotion_id, $id);
        $stmt->execute();
        $stmt->close();

        // Update movie categories
        $existing_category_ids = [];
        $sql = "SELECT category_id FROM movie_category WHERE movie_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $existing_category_ids[] = $row['category_id'];
        }
        $stmt->close();

        $new_category_ids = array_diff($category_ids, $existing_category_ids);
        $removed_category_ids = array_diff($existing_category_ids, $category_ids);

        foreach ($new_category_ids as $category_id) {
            $sql = "INSERT INTO movie_category (movie_id, category_id) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $category_id);
            $stmt->execute();
            $stmt->close();
        }

        foreach ($removed_category_ids as $category_id) {
            $sql = "DELETE FROM movie_category WHERE movie_id = ? AND category_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $category_id);
            $stmt->execute();
            $stmt->close();
        }

        // Update movie actors
        $existing_actor_ids = [];
        $sql = "SELECT actor_id FROM movie_actor WHERE movie_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $existing_actor_ids[] = $row['actor_id'];
        }
        $stmt->close();

        $new_actor_ids = array_diff($actor_ids, $existing_actor_ids);
        $removed_actor_ids = array_diff($existing_actor_ids, $actor_ids);

        foreach ($new_actor_ids as $actor_id) {
            $sql = "INSERT INTO movie_actor (movie_id, actor_id) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $actor_id);
            $stmt->execute();
            $stmt->close();
        }

        foreach ($removed_actor_ids as $actor_id) {
            $sql = "DELETE FROM movie_actor WHERE movie_id = ? AND actor_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $actor_id);
            $stmt->execute();
            $stmt->close();
        }

        // Update movie languages
        $existing_language_ids = [];
        $sql = "SELECT language_id FROM movie_language WHERE movie_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $existing_language_ids[] = $row['language_id'];
        }
        $stmt->close();

        $new_language_ids = array_diff($language_ids, $existing_language_ids);
        $removed_language_ids = array_diff($existing_language_ids, $language_ids);

        foreach ($new_language_ids as $language_id) {
            $sql = "INSERT INTO movie_language (movie_id, language_id) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $language_id);
            $stmt->execute();
            $stmt->close();
        }

        foreach ($removed_language_ids as $language_id) {
            $sql = "DELETE FROM movie_language WHERE movie_id = ? AND language_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $id, $language_id);
            $stmt->execute();
            $stmt->close();
        }

        // Update movie dates
        $existing_date_ids = [];
        $sql = "SELECT id FROM movie_date WHERE movie_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $existing_date_ids[] = $row['id'];
        }
        $stmt->close();

        $incoming_date_ids = array_column($dates, 'id');
        $new_dates = array_filter($dates, fn ($date) => !isset($date['id']));
        $existing_dates = array_filter($dates, fn ($date) => isset($date['id']));
        $removed_date_ids = array_diff($existing_date_ids, $incoming_date_ids);

        foreach ($new_dates as $date) {
            $start_time = $date['start_time'];
            $end_time = $date['end_time'];
            $sql = "INSERT INTO movie_date (movie_id, start_time, end_time) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iss", $id, $start_time, $end_time);
            $stmt->execute();
            $stmt->close();
        }

        foreach ($existing_dates as $date) {
            $date_id = $date['id'];
            $start_time = $date['start_time'];
            $end_time = $date['end_time'];
            $sql = "UPDATE movie_date SET start_time = ?, end_time = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssi", $start_time, $end_time, $date_id);
            $stmt->execute();
            $stmt->close();
        }

        foreach ($removed_date_ids as $date_id) {
            $sql = "DELETE FROM movie_date WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $date_id);
            $stmt->execute();
            $stmt->close();
        }

        $conn->commit();
        echo json_encode(['message' => 'Movie updated successfully', 'status' => 'success', 'data' => null]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['message' => 'Movie update failed', 'status' => 'error', 'data' => null]);
    }
} elseif ($method === 'DELETE') {
    error_log("RUNNING delete =======================>");
    if (isset($_GET['id'])) {
        // Delete movie and related records
        $id = intval($_GET['id']);
        error_log("ID =======================>" . $id);
        $conn->begin_transaction();
        try {
            // Delete related records in movie_category, movie_actor, movie_language, movie_date, and movie_seating
            $tables = ['movie_category', 'movie_actor', 'movie_date', 'movie_seating', 'movie_parking'];
            foreach ($tables as $table) {
                $sql = "DELETE FROM $table WHERE movie_id = ?";
                $stmt = $conn->prepare($sql);
                if (!$stmt) {
                    throw new Exception("Prepare statement failed for table $table: " . $conn->error);
                }
                $stmt->bind_param("i", $id);
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed for table $table: " . $stmt->error);
                }
                $stmt->close();
                error_log("Deleted from table $table =======================>");
            }

            // Delete movie record
            $sql = "DELETE FROM movie WHERE id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Prepare statement failed for movie: " . $conn->error);
            }
            $stmt->bind_param("i", $id);
            if (!$stmt->execute()) {
                throw new Exception("Execute failed for movie: " . $stmt->error);
            }
            $stmt->close();
            error_log("Deleted movie =======================>");

            $conn->commit();
            echo json_encode(['message' => 'Movie deleted successfully', 'status' => 'success', 'data' => null]);
        } catch (Exception $e) {
            $conn->rollback();
            error_log("Exception: " . $e->getMessage());
            echo json_encode(['message' => 'Movie deletion failed', 'id' => $id, 'status' => 'error', 'data' => null, 'error' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['message' => 'Movie ID not provided', 'status' => 'error', 'data' => null]);
    }
}
 else {
    echo json_encode(['message' => 'Invalid request method', 'status' => 'error', 'data' => null]);
}

$conn->close();
