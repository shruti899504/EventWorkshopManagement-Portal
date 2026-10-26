
const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all events with live registration count, capacity, and average rating
// Supports query params: search, category, sort
router.get("/", async (req, res) => {
    try {
        const { search, category, sort } = req.query;

        let query = `
            SELECT 
                e.id,
                e.title,
                e.description,
                e.category,
                e.event_date,
                e.event_time,
                e.venue,
                e.capacity,
                e.image_url,
                e.status,
                COALESCE(r.active_registrations, 0) AS registered_count,
                GREATEST(e.capacity - COALESCE(r.active_registrations, 0), 0) AS seats_left,
                ROUND(COALESCE(f.avg_rating, 0), 1) AS avg_rating,
                COALESCE(f.total_reviews, 0) AS total_reviews
            FROM events e
            LEFT JOIN (
                SELECT event_id, COUNT(*) AS active_registrations 
                FROM registrations 
                WHERE status = 'confirmed' 
                GROUP BY event_id
            ) r ON e.id = r.event_id
            LEFT JOIN (
                SELECT event_id, AVG(rating) AS avg_rating, COUNT(*) AS total_reviews
                FROM feedback
                GROUP BY event_id
            ) f ON e.id = f.event_id
            WHERE 1=1
        `;

        const params = [];

        if (search && search.trim()) {
            query += " AND (e.title LIKE ? OR e.venue LIKE ? OR e.description LIKE ?)";
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        if (category && category !== "All" && category.trim()) {
            query += " AND e.category = ?";
            params.push(category.trim());
        }

        // Sorting
        if (sort === "seats_high") {
            query += " ORDER BY seats_left DESC";
        } else if (sort === "seats_low") {
            query += " ORDER BY seats_left ASC";
        } else if (sort === "rating") {
            query += " ORDER BY avg_rating DESC";
        } else if (sort === "date_desc") {
            query += " ORDER BY e.event_date DESC, e.event_time DESC";
        } else {
            // Default: Upcoming date first
            query += " ORDER BY e.event_date ASC, e.event_time ASC";
        }

        const [events] = await db.query(query, params);

        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({
            message: "Failed to fetch events",
            error: error.message
        });
    }
});

// Get single event by id with stats
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [events] = await db.query(
            `SELECT 
                e.*,
                COALESCE(r.active_registrations, 0) AS registered_count,
                GREATEST(e.capacity - COALESCE(r.active_registrations, 0), 0) AS seats_left,
                ROUND(COALESCE(f.avg_rating, 0), 1) AS avg_rating,
                COALESCE(f.total_reviews, 0) AS total_reviews
            FROM events e
            LEFT JOIN (
                SELECT event_id, COUNT(*) AS active_registrations 
                FROM registrations 
                WHERE status = 'confirmed' 
                GROUP BY event_id
            ) r ON e.id = r.event_id
            LEFT JOIN (
                SELECT event_id, AVG(rating) AS avg_rating, COUNT(*) AS total_reviews
                FROM feedback
                GROUP BY event_id
            ) f ON e.id = f.event_id
            WHERE e.id = ?`,
            [Number(id)]
        );

        if (events.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json(events[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve event", error: error.message });
    }
});

// Create a new event (Admin only)
router.post("/", requireAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            event_date,
            event_time,
            venue,
            capacity,
            image_url,
            status
        } = req.body;

        if (
            typeof title !== "string" || !title.trim() ||
            typeof category !== "string" || !category.trim() ||
            !event_date || !event_time ||
            typeof venue !== "string" || !venue.trim() ||
            capacity === undefined || !Number.isInteger(Number(capacity)) || Number(capacity) < 1
        ) {
            return res.status(400).json({
                message: "Please provide valid event details and a positive seat capacity."
            });
        }

        const [result] = await db.query(
            `INSERT INTO events
            (title, description, category, event_date, event_time, venue, capacity, image_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                description ? description.trim() : "",
                category.trim(),
                event_date,
                event_time,
                venue.trim(),
                Number(capacity),
                image_url ? image_url.trim() : null,
                status || "Upcoming"
            ]
        );

        const [events] = await db.query("SELECT * FROM events WHERE id = ?", [result.insertId]);

        return res.status(201).json({
            message: "Event created successfully",
            event: events[0]
        });
    } catch (error) {
        console.error("Error creating event:", error);
        return res.status(500).json({
            message: "Failed to create event",
            error: error.message
        });
    }
});

// Update event (Admin only)
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            category,
            event_date,
            event_time,
            venue,
            capacity,
            image_url,
            status
        } = req.body;

        if (
            typeof title !== "string" || !title.trim() ||
            typeof category !== "string" || !category.trim() ||
            !event_date || !event_time ||
            typeof venue !== "string" || !venue.trim() ||
            capacity === undefined || Number(capacity) < 1
        ) {
            return res.status(400).json({
                message: "Please provide valid event details."
            });
        }

        const [existing] = await db.query("SELECT * FROM events WHERE id = ?", [Number(id)]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Event not found." });
        }

        await db.query(
            `UPDATE events SET
                title = ?,
                description = ?,
                category = ?,
                event_date = ?,
                event_time = ?,
                venue = ?,
                capacity = ?,
                image_url = ?,
                status = ?
            WHERE id = ?`,
            [
                title.trim(),
                description ? description.trim() : "",
                category.trim(),
                event_date,
                event_time,
                venue.trim(),
                Number(capacity),
                image_url ? image_url.trim() : null,
                status || "Upcoming",
                Number(id)
            ]
        );

        const [updated] = await db.query("SELECT * FROM events WHERE id = ?", [Number(id)]);

        return res.status(200).json({
            message: "Event updated successfully",
            event: updated[0]
        });
    } catch (error) {
        console.error("Error updating event:", error);
        return res.status(500).json({ message: "Failed to update event", error: error.message });
    }
});

// Delete event (Admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Cascade delete registrations & feedback
        await db.query("DELETE FROM registrations WHERE event_id = ?", [Number(id)]);
        await db.query("DELETE FROM feedback WHERE event_id = ?", [Number(id)]);
        const [result] = await db.query("DELETE FROM events WHERE id = ?", [Number(id)]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Event not found." });
        }

        return res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
        console.error("Error deleting event:", error);
        return res.status(500).json({ message: "Failed to delete event", error: error.message });
    }
});

module.exports = router;
