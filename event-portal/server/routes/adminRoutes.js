
const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get summary metrics for the admin dashboard
router.get("/metrics", requireAdmin, async (req, res) => {
    try {
        // Total events
        const [[eventsCount]] = await db.query("SELECT COUNT(*) AS total_events FROM events");
        
        // Total confirmed registrations
        const [[regsCount]] = await db.query(
            "SELECT COUNT(*) AS total_registrations FROM registrations WHERE status = 'confirmed'"
        );

        // Total users
        const [[usersCount]] = await db.query("SELECT COUNT(*) AS total_users FROM users WHERE role = 'user'");

        // Total capacity across all events
        const [[capacitySum]] = await db.query("SELECT COALESCE(SUM(capacity), 0) AS total_capacity FROM events");

        // Per-event registration counts and capacity status
        const [eventBreakdown] = await db.query(`
            SELECT 
                e.id,
                e.title,
                e.category,
                e.capacity,
                e.event_date,
                e.event_time,
                e.venue,
                e.status,
                COALESCE(r.confirmed_count, 0) AS confirmed_count,
                COALESCE(r.attended_count, 0) AS attended_count,
                GREATEST(e.capacity - COALESCE(r.confirmed_count, 0), 0) AS seats_left,
                ROUND((COALESCE(r.confirmed_count, 0) / e.capacity) * 100, 1) AS occupancy_percent
            FROM events e
            LEFT JOIN (
                SELECT 
                    event_id, 
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_count,
                    COUNT(CASE WHEN attended = 1 THEN 1 END) AS attended_count
                FROM registrations 
                GROUP BY event_id
            ) r ON e.id = r.event_id
            ORDER BY e.event_date ASC
        `);

        // Recent registrations
        const [recentRegistrations] = await db.query(`
            SELECT 
                r.id,
                r.full_name,
                r.email,
                r.contact_number,
                r.status,
                r.attended,
                r.registered_at,
                e.title AS event_title
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            ORDER BY r.registered_at DESC
            LIMIT 8
        `);

        return res.status(200).json({
            totals: {
                total_events: eventsCount.total_events,
                total_registrations: regsCount.total_registrations,
                total_users: usersCount.total_users,
                total_capacity: capacitySum.total_capacity
            },
            eventBreakdown,
            recentRegistrations
        });
    } catch (error) {
        console.error("Analytics metrics error:", error);
        return res.status(500).json({ message: "Failed to load dashboard metrics." });
    }
});

// Export registrations in CSV format
router.get("/export/registrations", requireAdmin, async (req, res) => {
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
                CASE WHEN r.attended = 1 THEN 'Yes' ELSE 'No' END AS attended,
                e.title AS event_title,
                e.category,
                e.venue,
                e.event_date,
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

        const [rows] = await db.query(query, params);

        // Convert to CSV
        if (rows.length === 0) {
            return res.send("Ticket,Name,Email,Contact,Status,Attended,Event Title,Category,Venue,Event Date,Registered At\n");
        }

        const headers = Object.keys(rows[0]).join(",");
        const csvLines = rows.map(row => {
            return Object.values(row)
                .map(val => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`)
                .join(",");
        });

        const csvContent = [headers, ...csvLines].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=eventora_registrations_${Date.now()}.csv`);
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error("CSV Export error:", error);
        return res.status(500).json({ message: "Failed to export CSV." });
    }
});

module.exports = router;
