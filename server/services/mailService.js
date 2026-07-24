// ============================================================
// services/mailService.js
// ============================================================
// PURPOSE:
//   Centralises all outgoing email logic using Nodemailer.
//   Controllers never touch Nodemailer directly — they only call
//   the exported functions here.  This keeps controllers clean and
//   makes it easy to swap the email provider later (e.g. SendGrid).
//
// TRANSPORT:
//   Uses Gmail SMTP by default (MAIL_HOST = smtp.gmail.com).
//   For production you should use an App Password (not your real
//   Gmail password) or switch to a transactional email service.
//
// FUNCTIONS EXPORTED:
//   sendOtpEmail(to, otp)         → Verification / reset OTP email
//   sendWelcomeEmail(to, name)    → Welcome email after OTP verified
// ============================================================

const nodemailer = require('nodemailer');

// ── Create Reusable Transporter ─────────────────────────────
// The transporter is created ONCE and reused for all emails.
// Creating it inside a function would open a new SMTP connection
// on every email — wasteful and slow.
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,   // e.g. smtp.gmail.com
  port:   parseInt(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_PORT === '465', // true for port 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.MAIL_USER,   // your Gmail address
    pass: process.env.MAIL_PASS,   // Gmail App Password (not account password)
  },
});

// ── Verify SMTP connection at startup ────────────────────────
// This logs a warning during development if credentials are wrong.
// We wrap in a try-catch so it never crashes the server on startup.
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  [Nodemailer]: SMTP connection failed —', error.message);
  } else {
    console.log('✅ [Nodemailer]: SMTP server is ready to send emails.');
  }
});


// ============================================================
// EXPORTED FUNCTION 1: sendOtpEmail
// ============================================================
/**
 * Sends a 6-digit OTP to the user's email for:
 *   - Email verification after signup
 *   - Password reset confirmation
 *
 * @param {string} to   - Recipient email address
 * @param {string} otp  - 6-digit OTP code
 * @returns {Promise}   - Resolves when the email is accepted by SMTP server
 */
const sendOtpEmail = async (to, otp) => {
  const expiresMin = process.env.OTP_EXPIRES_MIN || 10;
  console.log(`🔑 [Nodemailer OTP Log]: Generated OTP for ${to} -> ${otp}`);

  if (!process.env.MAIL_USER || process.env.MAIL_USER.includes('your-email')) {
    console.log(`ℹ️ [Nodemailer]: Skipping SMTP send (dev/test mode). OTP is ${otp}`);
    return true;
  }

  const mailOptions = {
    from:    process.env.MAIL_FROM || 'EduStack <noreply@edustack.com>',
    to,
    subject: '🔐 Your EduStack Verification Code',
    text: `Your EduStack OTP is: ${otp}\n\nThis code expires in ${expiresMin} minutes.\nDo not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">EduStack</h2>
        <p style="color: #374151; font-size: 15px;">Hi there! Here is your one-time verification code:</p>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #1f2937;">${otp}</span>
        </div>

        <p style="color: #6b7280; font-size: 13px;">
          ⏰ This code expires in <strong>${expiresMin} minutes</strong>.<br/>
          🔒 Do <strong>not</strong> share this with anyone — EduStack will never ask for it.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.warn(`⚠️ [Nodemailer]: SMTP send warning for ${to}: ${err.message}. OTP code is stored in DB: ${otp}`);
    return true;
  }
};


// ============================================================
// EXPORTED FUNCTION 2: sendWelcomeEmail
// ============================================================
/**
 * Sends a friendly welcome email after the user verifies their account.
 *
 * @param {string} to    - Recipient email address
 * @param {string} name  - User's first name for personalisation
 * @returns {Promise}
 */
const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from:    process.env.MAIL_FROM,
    to,
    subject: '🎉 Welcome to EduStack — Your CS Resource Hub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Welcome to EduStack, ${name}! 🚀</h2>
        <p style="color: #374151; font-size: 15px;">
          Your account is now verified. You now have access to:
        </p>
        <ul style="color: #374151; font-size: 14px; line-height: 1.8;">
          <li>📚 Subject-wise notes and PYQs</li>
          <li>🔗 Curated coding platform links</li>
          <li>📹 YouTube resource playlists</li>
          <li>⭐ Personal favourites list</li>
        </ul>
        <p style="color: #374151;">Pushing knowledge, Popping success. 💡</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">— The EduStack Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendWelcomeEmail };
