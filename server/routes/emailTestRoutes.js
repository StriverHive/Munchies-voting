// server/routes/emailTestRoutes.js
const express = require("express");
const { sendTestEmail } = require("../controllers/emailTestController");

const router = express.Router();

// POST /api/test-email/send
router.post("/send", sendTestEmail);

module.exports = router;
