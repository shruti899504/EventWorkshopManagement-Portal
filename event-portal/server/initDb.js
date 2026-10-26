
const db = require("./db");
const bcrypt = require("bcryptjs");

async function initDB() {
    try {
        // 1. Users table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if admin user exists, create default admin if not
        const [adminRows] = await db.query("SELECT * FROM users WHERE email = ?", ["admin@eventora.com"]);
        if (adminRows.length === 0) {
            const hash = await bcrypt.hash("admin123", 10);
            await db.query(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                ["Admin Master", "admin@eventora.com", hash, "admin"]
            );
            console.log("Default admin created: admin@eventora.com / admin123");
        }

        // Check if demo attendee user exists
        const [userRows] = await db.query("SELECT * FROM users WHERE email = ?", ["user@eventora.com"]);
        if (userRows.length === 0) {
            const hash = await bcrypt.hash("user123", 10);
            await db.query(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                ["John Doe", "user@eventora.com", hash, "user"]
            );
            console.log("Default user created: user@eventora.com / user123");
        }

        // 2. Ensure events table columns
        // Check if description column exists in events
        const [columns] = await db.query("SHOW COLUMNS FROM events LIKE 'description'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE events ADD COLUMN description TEXT AFTER title");
        }

        // 3. Ensure registrations table columns (attendance, status, user_id)
        const [regUserId] = await db.query("SHOW COLUMNS FROM registrations LIKE 'user_id'");
        if (regUserId.length === 0) {
            await db.query("ALTER TABLE registrations ADD COLUMN user_id INT NULL AFTER id");
        }

        const [regStatus] = await db.query("SHOW COLUMNS FROM registrations LIKE 'status'");
        if (regStatus.length === 0) {
            await db.query("ALTER TABLE registrations ADD COLUMN status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed' AFTER event_id");
        }

        const [regAttended] = await db.query("SHOW COLUMNS FROM registrations LIKE 'attended'");
        if (regAttended.length === 0) {
            await db.query("ALTER TABLE registrations ADD COLUMN attended BOOLEAN DEFAULT FALSE AFTER status");
        }

        // 4. Feedback table
        await db.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_email VARCHAR(150) NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `);

        console.log("Database initialized & schema updated successfully.");
    } catch (err) {
        console.error("Database schema init error:", err);
    }
}

module.exports = initDB;
