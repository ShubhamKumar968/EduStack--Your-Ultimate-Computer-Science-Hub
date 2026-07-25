// ============================================================
// server.js — DEPRECATED
// ============================================================
// This file has been merged into app.js.
//
// app.js now handles:
//   • Express app setup & middleware
//   • MongoDB connection
//   • HTTP server startup (app.listen)
//   • Graceful shutdown (SIGTERM / SIGINT)
//   • Unhandled rejection & uncaught exception handlers
//
// Entry point: node app.js
//              npm start  (runs "node app.js" via package.json)
//              npm run dev (runs "nodemon app.js")
// ============================================================

// Kept as a no-op re-export for backward compatibility
// (e.g. if any test or script still imports server.js)
module.exports = require('./app');
