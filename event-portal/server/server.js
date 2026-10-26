
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const initDB = require("./initDb");

const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize tables and default admin/user seeds
initDB();

app.get("/", (req, res) => {
    res.json({
        message: "Eventora Event & Workshop Management Portal API is running",
        version: "2.0.0"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT VERSION() AS version");
        res.json({
            message: "MySQL connected successfully",
            version: rows[0].version
        });
    } catch (error) {
        console.error("Database error:", error.message);
        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// Mounted API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Eventora Server running on port ${PORT}`);
});
