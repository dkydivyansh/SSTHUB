
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    sso BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS userdata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    rollno VARCHAR(50),
    avatar VARCHAR(255),
    batch INT,
    `group` CHAR(1),
    type ENUM('admin', 'member', 'faculty') DEFAULT 'member',
    status ENUM('active', 'disabled', 'pending') DEFAULT 'pending',
    disabledmsg TEXT,
    extra JSON, -- Expected structure: { "description": "", "social": { "github": "", "portfolio": "", "instagram": "", "linkedin": "", "gdev": "", "hackerone": "" }, "clubs": { "nlogn": "" }, "research": { "orcid": "" } }
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device JSON,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversations Table: The container for a chat room
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('direct_message', 'group') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participants Table: Maps users to conversations (Many-to-Many)
CREATE TABLE IF NOT EXISTS participants (
    conversation_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    last_seen_message_id BIGINT DEFAULT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages Table: The central log of all chat payloads
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id INT,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes (Crucial for 5k+ users)
CREATE INDEX idx_messages_conversation_id_created_at ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_participants_user_id ON participants (user_id);

-- Chat Requests Table: Handles connection requests before chat creation
CREATE TABLE IF NOT EXISTS chat_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message VARCHAR(500) NOT NULL,
    status ENUM('pending', 'accepted', 'ignored') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request (sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    conversation_id BIGINT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Community Tables
CREATE TABLE IF NOT EXISTS community_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    custom_pages JSON,
    logo VARCHAR(255),
    description TEXT,
    extras JSON,
    type ENUM('public', 'private') DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupid VARCHAR(50) NOT NULL,
    /* 
     context JSON structure:
     {
       "title": "Announcement Title",
       "content": "base64_encoded_markdown_string",
       "tags": ["tag1", "tag2"]
     }
    */
    context JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    pinned BOOLEAN DEFAULT FALSE,
    /*
     extras JSON structure (optional buttons):
     {
       "button1": "https://example.com",
       "button2": "https://example2.com"
     }
    */
    extras JSON,
    created_by INT NOT NULL,
    FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupid VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(12) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupid VARCHAR(50) NOT NULL,
    /*
     context JSON structure:
     {
       "title": "Event Title",
       "content": "base64_encoded_markdown_string",
       "tags": ["tag1", "tag2"],
       "type": "virtual" | "offline",
       "time": "YYYY-MM-DD HH:MM:SS"
     }
    */
    context JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    pinned BOOLEAN DEFAULT FALSE,
    /*
     extras JSON structure (optional buttons):
     {
       "button1": "https://example.com"
     }
    */
    extras JSON,
    created_by INT NOT NULL,
    FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS groupadmin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupid VARCHAR(50) NOT NULL,
    userids JSON NOT NULL,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (groupid) REFERENCES community_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id VARCHAR(50) NOT NULL,
    last_read_announcements INT DEFAULT 0,
    last_read_events INT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extras JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS group_attachments (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    group_id VARCHAR(50) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE
);

-- Class Tables
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    invitecode VARCHAR(16) UNIQUE NOT NULL,
    logo VARCHAR(255),
    description TEXT,
    extras JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classadmin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_membership (user_id, class_id)
);

-- Homework Tables
CREATE TABLE IF NOT EXISTS homework (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    extras JSON,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS homework_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    homework_id INT NOT NULL,
    submission JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (user_id, homework_id)
);
