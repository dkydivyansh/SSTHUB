# Session API Documentation

**Endpoint**: `POST /api/session`
**Content-Type**: `application/json`

This endpoint handles session validation, token refreshing, and device revocation for the SST HUB backend. All API requests must specify the `action` and `user_id` in the JSON body.

---

## 1. Validate Session
Validates the current session token to check if it's active, expired, or nearing expiration.

### Request Body
```json
{
  "action": "validate",
  "user_id": 1,
  "session_id": "YOUR_SESSION_TOKEN_HERE"
}
```

### Response
Returns the granular status of the session.
```json
{
  "status": "success",
  "data": {
    "session_status": "valid" // Can be: 'valid', 'refresh_required', or 'invalid_session'
  }
}
```
**Status Definitions:**
- `valid`: The session is active and healthy.
- `refresh_required`: Triggered if the session token is naturally expired (but the refresh token is still alive), OR if the session expires in < 1 hour, OR if the refresh token itself expires in < 24 hours.
- `invalid_session`: Triggered if the session does not exist, belongs to another user, or if BOTH the session and refresh tokens are completely expired.

---

## 2. Refresh Session
Exchanges an old session token and a valid refresh token for a completely new pair of tokens.

### Request Body
```json
{
  "action": "refresh",
  "user_id": 1,
  "session_id": "OLD_SESSION_TOKEN_HERE",
  "refresh_token": "YOUR_REFRESH_TOKEN_HERE"
}
```

### Response
Returns the newly generated credentials. The old tokens are invalidated implicitly because the database row is updated.
```json
{
  "status": "success",
  "data": {
    "session_id": "NEW_SESSION_TOKEN",
    "refresh_token": "NEW_REFRESH_TOKEN",
    "expires_at": "2026-08-14 10:00:00"
  }
}
```

---

## 3. Revoke Session (Logout)
Revokes a specific session (logs out the current device).

### Request Body
```json
{
  "action": "revoke",
  "user_id": 1,
  "session_id": "SESSION_TOKEN_TO_REVOKE"
}
```

### Response
```json
{
  "status": "success",
  "message": "session revoked"
}
```

---

## 4. Revoke Specific Device
Revokes a target device's session after validating the current active session. Useful for a "Logout from other devices" feature.

### Request Body
```json
{
  "action": "revoke_device",
  "user_id": 1,
  "current_session_id": "YOUR_ACTIVE_SESSION_TOKEN",
  "target_session_id": "DEVICE_SESSION_TOKEN_TO_REVOKE"
}
```

### Response
```json
{
  "status": "success",
  "message": "device session revoked"
}
```
