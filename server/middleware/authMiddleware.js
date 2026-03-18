// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Require valid JWT. Sets req.user = { _id, username, email }.
 * Returns 401 if missing or invalid token.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server auth not configured" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id username email");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { _id: user._id, username: user.username, email: user.email };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Authentication error" });
  }
};

/**
 * MongoDB filter: documents with no createdBy (legacy) OR createdBy = current user.
 * Use for list/read so existing data and user's data are visible.
 */
const createdByFilter = (req) => {
  const userId = req.user && req.user._id;
  if (!userId) return {};
  return {
    $or: [{ createdBy: null }, { createdBy: { $exists: false } }, { createdBy: userId }],
  };
};

/**
 * Check if the current user is allowed to modify this document (legacy or owner).
 */
const canModify = (doc, req) => {
  if (!doc || !req.user) return false;
  const createdBy = doc.createdBy ? doc.createdBy.toString() : null;
  if (!createdBy) return true; // legacy
  return createdBy === req.user._id.toString();
};

module.exports = {
  requireAuth,
  createdByFilter,
  canModify,
};
