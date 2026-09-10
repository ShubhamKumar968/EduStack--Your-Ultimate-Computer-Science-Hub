// ============================================================
// services/mailService.js
// ============================================================
// PURPOSE:
//   Centralises all outgoing email logic.
//   Supports:
//     1. Resend API (HTTPS REST — bypasses Render Free SMTP port blocks)
//     2. Brevo API  (HTTPS REST — bypasses Render Free SMTP port blocks)
//     3. Nodemailer (Standard SMTP for localhost / unblocked hosts)
// ============================================================

const dns = require('dns');
const nodemailer = require('nodemailer');

// ⚠️ Force IPv4 resolution across Node.js to eliminate ENETUNREACH errors on cloud hosts like Render
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
const mailPort = parseInt(process.env.MAIL_PORT, 10) || 465;

const transporter = nodemailer.createTransport({
  host:   mailHost,
  port:   mailPort,
  secure: mailPort === 465,
  family: 4,
  pool:   true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 4000, // 4-second timeout to fail fast if ports 465/587 are blocked on Render Free
  greetingTimeout: 4000,
  socketTimeout: 5000,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ── Verify SMTP connection at startup (non-blocking) ─────────
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
 * Sends a 6-digit OTP to the user's email.
 *
 * Supports:
 *   1. Resend API (HTTPS REST on port 443 — 100% works on Render Free tier)
 *   2. Brevo API (HTTPS REST on port 443)
 *   3. Nodemailer SMTP (Gmail / custom SMTP on port 465 or 587)
 *
 * @param {string} to   - Recipient email address
 * @param {string} otp  - 6-digit OTP code
 * @returns {Promise<Object>}
 */
const sendOtpEmail = async (to, otp) => {
  const expiresMin = process.env.OTP_EXPIRES_MIN || 10;

  // 🔑 Always log OTP to server logs so developer can view it in Render Dashboard Logs
  console.log(`🔑 [EduStack OTP]: Generated OTP for ${to} -> ${otp}`);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">EduStack</h2>
      <p style="color: #374151; font-size: 15px;">Hi there! Here is your one-time verification code:</p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #1f2937;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px;">
        ⏰ This code expires in <strong>${expiresMin} minutes</strong>.<br/>
        🔒 Do <strong>not</strong> share this code with anyone — EduStack will never ask for it.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  // ── 1. Brevo HTTPS REST API (Bypasses Render SMTP port blocking — sends to ALL users) ──
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.MAIL_USER || 'no-reply@edustack.com';
      console.log(`📡 [Brevo API]: Sending OTP to ${to} from ${senderEmail}...`);

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'EduStack', email: senderEmail },
          to: [{ email: to }],
          subject: '🔐 Your EduStack Verification Code',
          htmlContent: emailHtml,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ [Brevo API]: OTP delivered to ${to} via HTTPS (id: ${data.messageId})`);
        return { delivered: true, provider: 'brevo', id: data.messageId };
      }
      console.error(`❌ [Brevo API Rejected]: HTTP ${response.status} - ${data.message || JSON.stringify(data)}`);
    } catch (brevoErr) {
      console.error('❌ [Brevo API Error]:', brevoErr.message);
    }
  }

  // ── 2. Resend HTTPS REST API (Bypasses Render SMTP port blocking) ──
  if (process.env.RESEND_API_KEY) {
    try {
      // ⚠️ In Resend, you CANNOT send from @gmail.com or other unverified domains.
      // Use RESEND_FROM if custom domain is verified; otherwise MUST use 'EduStack <onboarding@resend.dev>'.
      let resendFrom = 'EduStack <onboarding@resend.dev>';
      if (process.env.RESEND_FROM) {
        resendFrom = process.env.RESEND_FROM.trim();
      } else if (process.env.MAIL_FROM && !process.env.MAIL_FROM.includes('@gmail.') && !process.env.MAIL_FROM.includes('@yahoo.') && !process.env.MAIL_FROM.includes('@outlook.')) {
        resendFrom = process.env.MAIL_FROM.trim();
      }

      console.log(`📡 [Resend API]: Sending OTP to ${to} from ${resendFrom}...`);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject: '🔐 Your EduStack Verification Code',
          html: emailHtml,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`✅ [Resend API]: OTP delivered to ${to} via HTTPS (id: ${data.id})`);
        return { delivered: true, provider: 'resend', id: data.id };
      }
      console.error(`❌ [Resend API Rejected]: HTTP ${response.status} - ${data.message || JSON.stringify(data)}`);
    } catch (apiErr) {
      console.error('❌ [Resend API Network Error]:', apiErr.message);
    }
  }

  // ── 3. SMTP via Nodemailer ──────────────────────────────────
  if (!process.env.MAIL_USER || process.env.MAIL_USER.includes('your-email')) {
    console.log(`ℹ️ [Nodemailer]: Skipping SMTP send (MAIL_USER not configured). OTP is ${otp}`);
    return { delivered: false, reason: 'MAIL_USER not configured', otp };
  }

  const mailOptions = {
    from:    process.env.MAIL_FROM || `EduStack <${process.env.MAIL_USER}>`,
    to,
    subject: '🔐 Your EduStack Verification Code',
    text:    `Your EduStack OTP is: ${otp}\n\nThis code expires in ${expiresMin} minutes.\nDo not share this code with anyone.`,
    html:    emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Nodemailer]: OTP email delivered to ${to} (id: ${info.messageId})`);
    return { delivered: true, provider: 'smtp', id: info.messageId };
  } catch (err) {
    console.warn(`⚠️ [Nodemailer SMTP Blocked]: ${err.message}. (Render Free tier blocks outbound SMTP ports 25, 465, and 587).`);
    console.log(`🔑 [EduStack OTP Code for ${to}]: ${otp}`);
    return { delivered: false, reason: err.message, blocked: true, otp };
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
 * @returns {Promise<Object>}
 */
const sendWelcomeEmail = async (to, name) => {
  const welcomeHtml = `
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
  `;

  // ── 1. Brevo HTTPS REST API (Bypasses Render SMTP port blocking — sends to ALL users) ──
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.MAIL_USER || 'no-reply@edustack.com';
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'EduStack', email: senderEmail },
          to: [{ email: to }],
          subject: '🎉 Welcome to EduStack — Your CS Resource Hub!',
          htmlContent: welcomeHtml,
        }),
      });
      return { delivered: true, provider: 'brevo' };
    } catch (_) {}
  }

  // ── 2. Resend HTTPS REST API ────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      let resendFrom = 'EduStack <onboarding@resend.dev>';
      if (process.env.RESEND_FROM) {
        resendFrom = process.env.RESEND_FROM.trim();
      } else if (process.env.MAIL_FROM && !process.env.MAIL_FROM.includes('@gmail.') && !process.env.MAIL_FROM.includes('@yahoo.') && !process.env.MAIL_FROM.includes('@outlook.')) {
        resendFrom = process.env.MAIL_FROM.trim();
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject: '🎉 Welcome to EduStack — Your CS Resource Hub!',
          html: welcomeHtml,
        }),
      });
      return { delivered: true, provider: 'resend' };
    } catch (_) {}
  }

  if (!process.env.MAIL_USER || process.env.MAIL_USER.includes('your-email')) {
    return { delivered: false };
  }

  const mailOptions = {
    from:    process.env.MAIL_FROM || `EduStack <${process.env.MAIL_USER}>`,
    to,
    subject: '🎉 Welcome to EduStack — Your CS Resource Hub!',
    html:    welcomeHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { delivered: true, id: info.messageId };
  } catch (err) {
    console.warn('⚠️ [Welcome Email Warning]:', err.message);
    return { delivered: false, reason: err.message };
  }
};

module.exports = { sendOtpEmail, sendWelcomeEmail };
