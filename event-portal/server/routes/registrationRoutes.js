
const express = require("express");
const db = require("../db");
const { optionalToken, authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Register for an event with capacity lock & duplicate prevention
router.post("/", optionalToken, async (req, res) => {
    try {
        const {
            full_name,
            email,
            contact_number,
            event_id
        } = req.body;

        if (
            typeof full_name !== "string" ||
            !full_name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof contact_number !== "string" ||
            !contact_number.trim() ||
            !Number.isInteger(Number(event_id)) ||
            Number(event_id) < 1
        ) {
            return res.status(400).json({
                message: "Please provide valid registration details."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const eventIdNum = Number(event_id);

        // Fetch event and verify capacity
        const [events] = await db.query(
            `SELECT e.*, 
                    COALESCE(r.active_registrations, 0) AS registered_count
             FROM events e
             LEFT JOIN (
                 SELECT event_id, COUNT(*) AS active_registrations 
                 FROM registrations 
                 WHERE status = 'confirmed' 
                 GROUP BY event_id
             ) r ON e.id = r.event_id
             WHERE e.id = ?`,
            [eventIdNum]
        );

        if (events.length === 0) {
            return res.status(404).json({ message: "Event not found." });
        }

        const event = events[0];

        // 1. Capacity Check: Prevent overbooking
        if (event.registered_count >= event.capacity) {
            return res.status(400).json({
                message: `Sorry, this event is already fully booked! Maximum capacity (${event.capacity} seats) reached.`
            });
        }

        // 2. Duplicate Registration Check
        const [existingRegs] = await db.query(
            "SELECT id, status FROM registrations WHERE email = ? AND event_id = ?",
            [normalizedEmail, eventIdNum]
        );

        if (existingRegs.length > 0) {
            if (existingRegs[0].status === "confirmed") {
                return res.status(409).json({
                    message: "You are already registered for this event! Check your ticket or registrations."
                });
            } else {
                // If previously cancelled, re-activate registration
                await db.query(
                    "UPDATE registrations SET status = 'confirmed', full_name = ?, contact_number = ?, registered_at = NOW() WHERE id = ?",
                    [full_name.trim(), contact_number.trim(), existingRegs[0].id]
                );

                return res.status(200).json({
                    message: "Your registration has been reactivated successfully!",
                    registration_id: existingRegs[0].id,
                    ticket_number: `EVT-${event.id}-${existingRegs[0].id}`,
                    event: {
                        id: event.id,
                        title: event.title,
                        venue: event.venue,
                        event_date: event.event_date,
                        event_time: event.event_time,
                        category: event.category
                    }
                });
            }
        }

        const userId = req.user ? req.user.id : null;

        const [result] = await db.query(
            `INSERT INTO registrations
            (user_id, full_name, email, contact_number, event_id, status, attended)
            VALUES (?, ?, ?, ?, ?, 'confirmed', FALSE)`,
            [
                userId,
                full_name.trim(),
                normalizedEmail,
                contact_number.trim(),
                eventIdNum
            ]
        );

        const newRegId = result.insertId;

        return res.status(201).json({
            message: "Registration successful! Your seat is secured.",
            registration_id: newRegId,
            ticket_number: `EVT-${event.id}-${newRegId}`,
            event: {
                id: event.id,
                title: event.title,
                venue: event.venue,
                event_date: event.event_date,
                event_time: event.event_time,
                category: event.category
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        return res.status(500).json({
            message: "Registration failed due to a server error."
        });
    }
});

// Get user's own registrations ("My Registrations")
router.get("/my", authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userId = req.user.id;

        const [registrations] = await db.query(
            `SELECT
                r.id AS registration_id,
                CONCAT('EVT-', e.id, '-', r.id) AS ticket_number,
                r.full_name,
                r.email,
                r.contact_number,
                r.status,
                r.attended,
                r.registered_at,
                e.id AS event_id,
                e.title AS event_title,
                e.category,
                e.venue,
                e.event_date,
                e.event_time,
                e.image_url,
                e.status AS event_status
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.user_id = ? OR r.email = ?
            ORDER BY e.event_date DESC, r.registered_at DESC`,
            [userId, userEmail]
        );

        return res.status(200).json(registrations);
    } catch (error) {
        console.error("Error fetching user registrations:", error);
        return res.status(500).json({ message: "Failed to fetch registrations." });
    }
});

// Cancel a registration (Attendee or Admin)
router.patch("/:id/cancel", optionalToken, async (req, res) => {
    try {
        const regId = Number(req.params.id);

        const [regs] = await db.query("SELECT * FROM registrations WHERE id = ?", [regId]);
        if (regs.length === 0) {
            return res.status(404).json({ message: "Registration not found." });
        }

        const registration = regs[0];

        // Check permission if token is provided and not admin
        if (req.user && req.user.role !== "admin" && req.user.email !== registration.email && req.user.id !== registration.user_id) {
            return res.status(403).json({ message: "You are not authorized to cancel this registration." });
        }

        await db.query("UPDATE registrations SET status = 'cancelled' WHERE id = ?", [regId]);

        return res.status(200).json({ message: "Registration cancelled successfully. Seat has been freed." });
    } catch (error) {
        console.error("Cancel registration error:", error);
        return res.status(500).json({ message: "Failed to cancel registration." });
    }
});

// Toggle attendance (Admin only)
router.patch("/:id/attendance", requireAdmin, async (req, res) => {
    try {
        const regId = Number(req.params.id);
        const { attended } = req.body;

        await db.query("UPDATE registrations SET attended = ? WHERE id = ?", [Boolean(attended), regId]);

        return res.status(200).json({ message: "Attendance updated successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update attendance." });
    }
});

// Get all registrations for admin dashboard (with filter by event_id)
router.get("/", requireAdmin, async (req, res) => {
    try {
        const { event_id } = req.query;

        let query = `
            SELECT
                r.id,
                CONCAT('EVT-', e.id, '-', r.id) AS ticket_number,
                r.full_name,
                r.email,
                r.contact_number,
                r.status,
                r.attended,
                r.event_id,
                e.title AS event_title,
                e.venue,
                e.event_date,
                e.event_time,
                r.registered_at
            FROM registrations r
            JOIN events e ON r.event_id = e.id
        `;
        const params = [];

        if (event_id) {
            query += " WHERE r.event_id = ?";
            params.push(Number(event_id));
        }

        query += " ORDER BY r.registered_at DESC";

        const [registrations] = await db.query(query, params);

        return res.status(200).json(registrations);
    } catch (error) {
        console.error("Fetch registrations error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch registrations."
        });
    }
});

module.exports = router;
