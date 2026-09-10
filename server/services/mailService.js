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

const isGmail = (!process.env.MAIL_HOST || process.env.MAIL_HOST.includes('gmail'));

const transporter = nodemailer.createTransport(
  isGmail
    ? {
        service: 'gmail',
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
    : {
        host:   process.env.MAIL_HOST || 'smtp.gmail.com',
        port:   parseInt(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_PORT === '465',
        family: 4,
        pool: true,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
);

// ── Verify SMTP connection at startup ────────────────────────
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  [Nodemailer]: SMTP connection warning —', error.message);
  } else {
    console.log('✅ [Nodemailer]: SMTP server is ready with warm connection pool.');
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
  // ⚠️ NEVER log OTP in production — it would be visible in Render dashboard logs
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔑 [Nodemailer OTP Log - DEV ONLY]: Generated OTP for ${to} -> ${otp}`);
  }

  if (!process.env.MAIL_USER || process.env.MAIL_USER.includes('your-email')) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`ℹ️ [Nodemailer]: Skipping SMTP send (dev/test mode). OTP is ${otp}`);
    }
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
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Nodemailer]: OTP email delivered to ${to} (id: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`❌ [Nodemailer]: SMTP send error for ${to}: ${err.message}`);
    throw new Error(`Email delivery failed (${err.message}). Please check if MAIL_USER and MAIL_PASS are set in Render.`);
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
