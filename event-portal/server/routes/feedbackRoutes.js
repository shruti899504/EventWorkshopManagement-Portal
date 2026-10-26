
const express = require("express");
const db = require("../db");
const { optionalToken } = require("../middleware/auth");

const router = express.Router();

// Submit feedback for an event
router.post("/", optionalToken, async (req, res) => {
    try {
        const { event_id, rating, comment, user_name, user_email } = req.body;

        if (!event_id || !rating || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({ message: "Valid rating (1 to 5) and event ID are required." });
        }

        const name = req.user ? req.user.name : (user_name || "Anonymous Attendee");
        const email = req.user ? req.user.email : (user_email || "anonymous@eventora.com");

        const [result] = await db.query(
            "INSERT INTO feedback (event_id, rating, comment, user_name, user_email) VALUES (?, ?, ?, ?, ?)",
            [Number(event_id), Number(rating), comment ? comment.trim() : "", name, email]
        );

        return res.status(201).json({
            message: "Thank you for your feedback!",
            feedback_id: result.insertId
        });
    } catch (error) {
        console.error("Feedback submission error:", error);
        return res.status(500).json({ message: "Failed to submit feedback." });
    }
});

// Get feedback for a specific event
router.get("/event/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;

        const [reviews] = await db.query(
            "SELECT id, rating, comment, user_name, created_at FROM feedback WHERE event_id = ? ORDER BY created_at DESC",
            [Number(eventId)]
        );

        const [stats] = await db.query(
            "SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total_reviews FROM feedback WHERE event_id = ?",
            [Number(eventId)]
        );

        return res.status(200).json({
            stats: stats[0] || { avg_rating: 0, total_reviews: 0 },
            reviews
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch feedback." });
    }
});

module.exports = router;
