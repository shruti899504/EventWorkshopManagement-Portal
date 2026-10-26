
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "eventora_super_secret_mca_key_2026";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication required. Token missing." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === "admin") {
            return next();
        }
        return res.status(403).json({ message: "Access forbidden. Admin privileges required." });
    });
}

function optionalToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
            req.user = user;
        }
        next();
    });
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireAdmin,
    optionalToken
};
