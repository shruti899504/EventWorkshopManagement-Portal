
const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "event_portal",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;
