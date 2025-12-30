// server/controllers/emailTestController.js
const { sendEmail } = require("../utils/emailService");

// Simple controller to send a test email
// Later you can call this from frontend (no Postman needed)
const sendTestEmail = async (req, res) => {
  try {
    // You can later pass "to" in req.body from frontend.
    // For now it defaults to TEST_EMAIL_TO or EMAIL_USER from .env
    const to =
      (req.body && req.body.to) ||
      process.env.TEST_EMAIL_TO ||
      process.env.EMAIL_USER;

    if (!to) {
      return res.status(400).json({
        message:
          "No recipient email. Please set TEST_EMAIL_TO or EMAIL_USER in .env",
      });
    }

    await sendEmail({
      to,
      subject: "Test email from Voting App",
      html: `<p>Hello,</p>
             <p>This is a <strong>test email</strong> from your Voting System backend.</p>
             <p>If you received this, Nodemailer + Gmail are working correctly ✅</p>`,
    });

    return res.json({
      message: `Test email sent to ${to}`,
    });
  } catch (error) {
    console.error("sendTestEmail error:", error);
    return res.status(500).json({
      message: "Failed to send test email",
      error: error.message,
    });
  }
};

module.exports = {
  sendTestEmail,
};
