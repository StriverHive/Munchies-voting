// server/utils/emailService.js
const nodemailer = require("nodemailer");
const {
  logEmailSendStart,
  logEmailSendOk,
  logEmailSendFail,
} = require("./emailLog");

// Read config from environment with safe defaults for Gmail
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

/** Render.com (and some other PaaS) often block outbound SMTP → connection timeouts to Gmail. */
const IS_RENDER = process.env.RENDER === "true";
/** Set EMAIL_SKIP_VERIFY=true on Render to skip startup SMTP check (still won't fix blocked SMTP). */
const SKIP_EMAIL_VERIFY =
  process.env.EMAIL_SKIP_VERIFY === "true" ||
  (IS_RENDER && process.env.EMAIL_FORCE_SMTP_VERIFY !== "true");

// Log what we are using (without password)
console.log("📧 Email config:", {
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  user: EMAIL_USER ? EMAIL_USER : "(not set)",
  from: EMAIL_FROM ? EMAIL_FROM : "(not set)",
});

// Create a transporter using ENV config (timeouts avoid hanging forever)
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true only for 465
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 15000,
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 15000,
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000,
});

if (IS_RENDER) {
  console.warn(
    "⚠️  Running on Render: outbound SMTP (ports 587/465) is often blocked. " +
      "If you see connection timeouts, use an email API (Resend, SendGrid, Mailgun) over HTTPS instead of Gmail SMTP. " +
      "See server/docs/EMAIL_ON_RENDER.md"
  );
}

// Optional: verify connection on startup (skip on Render unless EMAIL_FORCE_SMTP_VERIFY=true)
if (SKIP_EMAIL_VERIFY) {
  console.log(
    "📧 Email: skipping SMTP verify on startup (EMAIL_SKIP_VERIFY or Render default). " +
      "Sending may still fail if SMTP is blocked."
  );
} else {
  transporter
    .verify()
    .then(() => {
      console.log("✅ Email transporter is ready to send messages");
    })
    .catch((err) => {
      console.error("❌ Email transporter error:", err.message);
      if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(String(err.message))) {
        console.error(
          "   → Likely cause: host blocks outbound SMTP (common on Render free tier) or wrong host/port/firewall."
        );
      }
    });
}

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
 * @param {Object} [options.meta] - for logs: { context, voteId, employeeId, ... }
 */
const sendEmail = async ({ to, subject, html, text, meta = {} }) => {
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

  logEmailSendStart(meta, to, subject);
  const t0 = Date.now();
  try {
    const info = await transporter.sendMail(mailOptions);
    logEmailSendOk(meta, to, Date.now() - t0, info);
    return info;
  } catch (err) {
    logEmailSendFail(meta, to, Date.now() - t0, err);
    throw err;
  }
};

module.exports = {
  sendEmail,
};
