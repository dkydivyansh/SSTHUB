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
     * Validates session and returns granular status.
     * @return string 'valid', 'refresh_required', or 'invalid_session'
     */
    public function validateSessionStatus($user_id, $session_id) {
        $stmt = $this->db->prepare("
            SELECT s.id, s.expires_at, s.created_at, ud.status
            FROM sessions s
            JOIN userdata ud ON s.user_id = ud.user_id
            WHERE s.user_id = ? AND s.session_id = ? LIMIT 1
        ");
        $stmt->execute([$user_id, $session_id]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            return 'invalid_session';
        }

        if ($session['status'] === 'disabled') {
            return 'disabled';
        }

        $now = time();
        $expires_at = strtotime($session['expires_at']);
        $created_at = strtotime($session['created_at']);
        
        $refresh_expires_at = $created_at + (7 * 24 * 60 * 60);

        // If refresh token is expired
        if ($now > $refresh_expires_at) {
            $this->revokeSession($user_id, $session_id);
            return 'invalid_session';
        }

        // If session is expired, but refresh is valid
        if ($now > $expires_at) {
            return 'refresh_required';
        }

        // If session expires in < 1 hour
        if ($expires_at - $now < 3600) {
            return 'refresh_required';
        }

        // If refresh token expires in < 24 hours
        if ($refresh_expires_at - $now < (24 * 3600)) {
            return 'refresh_required';
        }

        return 'valid';
    }

    /**
     * Refreshes a session by generating a new session_id and extending expiration.
     * Validates that the refresh token isn't older than 7 days.
     * @param int $user_id
     * @param string $session_id
     * @param string $refresh_token
     * @return array|false Returns new session info or false if invalid/expired
     */
    public function refreshSession($user_id, $session_id, $refresh_token) {
        $stmt = $this->db->prepare("SELECT id, created_at FROM sessions WHERE user_id = ? AND session_id = ? AND refresh_token = ? LIMIT 1");
        $stmt->execute([$user_id, $session_id, $refresh_token]);
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

        // Token is valid, generate new session id and new refresh token
        $new_session_id = bin2hex(random_bytes(32));
        $new_refresh_token = bin2hex(random_bytes(32));
        $new_expires_at = date('Y-m-d H:i:s', time() + (24 * 60 * 60));
        $new_created_at = date('Y-m-d H:i:s', time()); // Reset 7 day window

        $updateStmt = $this->db->prepare("UPDATE sessions SET session_id = ?, refresh_token = ?, expires_at = ?, created_at = ? WHERE id = ?");
        $updateStmt->execute([$new_session_id, $new_refresh_token, $new_expires_at, $new_created_at, $session['id']]);

        return [
            'session_id' => $new_session_id,
            'refresh_token' => $new_refresh_token,
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
        $stmt->execute([$user_id, $session_id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Revokes a specific device session after validating the current session.
     * @param int $user_id
     * @param string $current_session_id
     * @param string $target_session_id
     * @return bool
     */
    public function revokeDevice($user_id, $current_session_id, $target_session_id) {
        $status = $this->validateSessionStatus($user_id, $current_session_id);
        if ($status !== 'valid' && $status !== 'refresh_required') {
            return false;
        }

        $stmt = $this->db->prepare("DELETE FROM sessions WHERE user_id = ? AND session_id = ?");
        $stmt->execute([$user_id, $target_session_id]);
        return $stmt->rowCount() > 0;
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
