<?php

class SessionManager {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    /**
     * Creates a new session for a user.
     * @param int $user_id
     * @param array $device_info (optional)
     * @return array Contains session_id and refresh_token
     */
    public function createSession($user_id, $device_info = []) {
        $session_id = bin2hex(random_bytes(32));
        $refresh_token = bin2hex(random_bytes(32));
        
        // Session ID expires in 24 hours
        $expires_at = date('Y-m-d H:i:s', time() + (24 * 60 * 60));
        
        $device_json = json_encode($device_info);

        $stmt = $this->db->prepare("INSERT INTO sessions (user_id, session_id, refresh_token, device, expires_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $session_id, $refresh_token, $device_json, $expires_at]);

        return [
            'session_id' => $session_id,
            'refresh_token' => $refresh_token,
            'expires_at' => $expires_at
        ];
    }

    /**
     * Validates a session by checking if it exists and hasn't expired.
     * @param int $user_id
     * @param string $session_id
     * @return bool
     */
    public function validateSession($user_id, $session_id) {
        $stmt = $this->db->prepare("SELECT id, expires_at FROM sessions WHERE user_id = ? AND session_id = ? LIMIT 1");
        $stmt->execute([$user_id, $session_id]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            return false;
        }

        // Check if session has expired
        if (strtotime($session['expires_at']) < time()) {
            // Delete expired session
            $this->revokeSession($user_id, $session_id);
            return false;
        }

        return true;
    }

    /**
     * Refreshes a session by generating a new session_id and extending expiration.
     * Validates that the refresh token isn't older than 7 days.
     * @param int $user_id
     * @param string $refresh_token
     * @return array|false Returns new session info or false if invalid/expired
     */
    public function refreshSession($user_id, $refresh_token) {
        $stmt = $this->db->prepare("SELECT id, user_id, created_at FROM sessions WHERE user_id = ? AND refresh_token = ? LIMIT 1");
        $stmt->execute([$user_id, $refresh_token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            return false;
        }

        // Refresh token lives for 7 days
        $seven_days_ago = time() - (7 * 24 * 60 * 60);
        if (strtotime($session['created_at']) < $seven_days_ago) {
            // Refresh token has expired, delete the session
            $delStmt = $this->db->prepare("DELETE FROM sessions WHERE id = ?");
            $delStmt->execute([$session['id']]);
            return false;
        }

        // Token is valid, generate new session id
        $new_session_id = bin2hex(random_bytes(32));
        $new_expires_at = date('Y-m-d H:i:s', time() + (24 * 60 * 60));

        $updateStmt = $this->db->prepare("UPDATE sessions SET session_id = ?, expires_at = ? WHERE id = ?");
        $updateStmt->execute([$new_session_id, $new_expires_at, $session['id']]);

        return [
            'session_id' => $new_session_id,
            'refresh_token' => $refresh_token, // keep the same refresh token
            'expires_at' => $new_expires_at
        ];
    }

    /**
     * Deletes a specific session (Logout for one device).
     * @param int $user_id
     * @param string $session_id
     * @return bool
     */
    public function revokeSession($user_id, $session_id) {
        $stmt = $this->db->prepare("DELETE FROM sessions WHERE user_id = ? AND session_id = ?");
        return $stmt->execute([$user_id, $session_id]);
    }

    /**
     * Deletes all sessions for a user (Logout all devices).
     * @param int $user_id
     * @return bool
     */
    public function revokeAll($user_id) {
        $stmt = $this->db->prepare("DELETE FROM sessions WHERE user_id = ?");
        return $stmt->execute([$user_id]);
    }
}
?>
