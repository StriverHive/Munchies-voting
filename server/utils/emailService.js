// server/utils/emailService.js
const nodemailer = require("nodemailer");

// Read config from environment with safe defaults for Gmail
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

// Log what we are using (without password)
console.log("📧 Email config:", {
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  user: EMAIL_USER ? EMAIL_USER : "(not set)",
  from: EMAIL_FROM ? EMAIL_FROM : "(not set)",
});

// Create a transporter using ENV config
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true only for 465
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Optional: verify connection on startup (logs result)
transporter
  .verify()
  .then(() => {
    console.log("✅ Email transporter is ready to send messages");
  })
  .catch((err) => {
    console.error("❌ Email transporter error:", err.message);
  });

const stripHtmlToText = (html) => {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|tr|h1|h2|h3)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

/**
 * Generic sendEmail helper
 * @param {Object} options
 * @param {string|string[]} options.to - recipient email(s)
 * @param {string} options.subject - email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - plain text (optional)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) throw new Error("sendEmail: 'to' is required");
  if (!subject) throw new Error("sendEmail: 'subject' is required");
  if (!html && !text) throw new Error("sendEmail: 'html' or 'text' is required");

  const mailOptions = {
    from: EMAIL_FROM || EMAIL_USER,
    to,
    subject,
    text: text || (html ? stripHtmlToText(html) : undefined),
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
};
