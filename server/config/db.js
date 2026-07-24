// ============================================================
// config/db.js
// ============================================================
// PURPOSE:
//   Handles the MongoDB connection using Mongoose.
//   Called once from server.js at startup — NOT imported inside
//   routes or controllers (a single connection is reused app-wide).
//
// WHY A SEPARATE FILE?
//   Keeping DB config isolated means you can swap databases
//   (e.g. switch to Atlas from local) by editing one file only.
//
// RETRY LOGIC:
//   Mongoose 6+ automatically attempts to reconnect on drops.
//   We additionally listen to 'disconnected' events for logging.
// ============================================================

const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB Atlas (or local) using the
 * MONGO_URI environment variable defined in server/.env
 *
 * @returns {Promise<void>}
 * @throws  Will throw and crash the process if initial connection fails,
 *          so the app never starts with a broken DB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are good practice for production stability:
      serverSelectionTimeoutMS: 5000, // Give up after 5 s if server unreachable
      socketTimeoutMS: 45000,         // Close sockets after 45 s of inactivity
    });

    console.log(`✅ [MongoDB Connected]: Host → ${conn.connection.host}`);
  } catch (error) {
    // Log the specific error before exiting so we know what went wrong
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    process.exit(1); // Non-zero exit code signals failure to the OS / PM2
  }
};

// ── Event Listeners ─────────────────────────────────────────
// Mongoose fires these events on the default connection object.

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  [MongoDB]: Connection lost. Mongoose will auto-retry...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 [MongoDB]: Reconnected successfully.');
});

module.exports = connectDB;
