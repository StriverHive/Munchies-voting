// server/config/mailer.js
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Gmail: false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optional: log if connection works
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email server connection error:", err.message);
  } else {
    console.log("📧 Email server is ready to send emails");
  }
});

module.exports = transporter;
