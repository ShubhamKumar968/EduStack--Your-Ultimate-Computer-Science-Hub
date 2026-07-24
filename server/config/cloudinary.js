// ============================================================
// config/cloudinary.js
// ============================================================
// PURPOSE:
//   Initialises the Cloudinary v2 SDK with credentials from .env
//   and exports a pre-configured instance.
//
// ⚠️  ALL credentials MUST come from environment variables.
//     Never hardcode api_key or api_secret — they are secrets.
//
// USAGE IN CONTROLLERS:
//   const { cloudinary, bufferToBase64Uri } = require('../config/cloudinary');
//
//   const result = await cloudinary.uploader.upload(base64Uri, {
//     folder: 'edustack_profiles',    // ← user profile pictures
//     folder: 'edustack_subjects',    // ← subject thumbnail images
//     folder: 'edustack_resources',   // ← notes & PYQ PDF files
//   });
//   const url = result.secure_url;   ← Store this URL in MongoDB
// ============================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cloudinaryLib = require('cloudinary').v2;

// ── Validate required environment variables ───────────────────
// Fail loudly at startup if Cloudinary config is missing.
// This prevents silent upload failures in production.
const missingVars = [];
if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) missingVars.push('CLOUDINARY_CLOUD_NAME');
if (!process.env.CLOUDINARY_API_KEY    && !process.env.CLOUDINARY_URL) missingVars.push('CLOUDINARY_API_KEY');
if (!process.env.CLOUDINARY_API_SECRET && !process.env.CLOUDINARY_URL) missingVars.push('CLOUDINARY_API_SECRET');

if (missingVars.length > 0) {
  console.warn(`⚠️ [Cloudinary]: Missing env vars: ${missingVars.join(', ')}. Image uploads will fail.`);
}

// ── Configure Cloudinary from environment ─────────────────────
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  cloudinaryLib.config({ cloudinary_url: process.env.CLOUDINARY_URL, secure: true });
} else {
  cloudinaryLib.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

if (missingVars.length === 0) {
  console.log('✅ [Cloudinary]: SDK configured successfully.');
}

/**
 * Converts a multer file object (memoryStorage) into a base64 data URI
 * string that Cloudinary's uploader accepts directly.
 *
 * @param   {Express.Multer.File} fileObject  - Multer file (with .buffer and .mimetype)
 * @returns {string}                          - Base64 data URI, or empty string if invalid
 */
const bufferToBase64Uri = (fileObject) => {
  if (!fileObject || !fileObject.buffer) {
    return ''; // Guard: never crash on missing file
  }
  return `data:${fileObject.mimetype};base64,${fileObject.buffer.toString('base64')}`;
};

module.exports = { cloudinary: cloudinaryLib, bufferToBase64Uri };
