const jwt = require("jsonwebtoken");

/**
 * JWT Verification Middleware
 * Extracts Bearer token from Authorization header and verifies it.
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey123"
    );
    req.user = decoded; // { id, role, customId, email }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }
}

/**
 * Admin role verification middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "Admin" && req.user.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: "Access forbidden. Administrator privileges required.",
    });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };

