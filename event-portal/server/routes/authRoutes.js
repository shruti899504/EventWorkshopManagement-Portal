
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        // Check if user already exists
        const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (existing.length > 0) {
            return res.status(409).json({ message: "Email is already registered. Please log in." });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
            [name.trim(), email.toLowerCase().trim(), password_hash]
        );

        const token = jwt.sign(
            { id: result.insertId, email: email.toLowerCase().trim(), name: name.trim(), role: "user" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            message: "Registration successful!",
            token,
            user: {
                id: result.insertId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                role: "user"
            }
        });
    } catch (error) {
        console.error("User registration error:", error);
        return res.status(500).json({ message: "Internal server error during registration." });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password." });
        }

        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("User login error:", error);
        return res.status(500).json({ message: "Internal server error during login." });
    }
});

// Get current profile
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({ user: users[0] });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch user profile." });
    }
});

module.exports = router;
