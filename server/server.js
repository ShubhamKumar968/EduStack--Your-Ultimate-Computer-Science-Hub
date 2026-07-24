// ============================================================
// server.js
// ============================================================
// PURPOSE:
//   The application entry point. Its ONLY job is to:
//     1. Import the configured Express app from app.js
//     2. Start the HTTP server on the configured port
//     3. Handle unhandled errors and graceful shutdown
//
// WHY SEPARATE FROM app.js?
//   Keeping HTTP listening logic separate from app setup means:
//     • Tests can import app.js without starting a real server
//     • Graceful shutdown logic lives in one clean place
//     • Easy to wrap with clustering (e.g. PM2 cluster mode)
//
// GRACEFUL SHUTDOWN:
//   When the process receives SIGTERM (e.g. from PM2, Docker, Ctrl+C),
//   we stop accepting new connections and close existing ones cleanly
//   before exiting. This prevents dropped requests mid-processing.
// ============================================================

const app  = require('./app');

// ── Read port from environment (default: 5000) ───────────────
const PORT = process.env.PORT || 5000;

// ── Start HTTP Server ─────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║        🚀  EduStack API Server Started         ║
  ╠═══════════════════════════════════════════════╣
  ║  Port    : ${PORT}                               
  ║  Mode    : ${process.env.NODE_ENV || 'development'}                     
  ║  Health  : http://localhost:${PORT}/api/health    
  ╚═══════════════════════════════════════════════╝
  `);
});


// ============================================================
// UNHANDLED PROMISE REJECTIONS
// ============================================================
// Catches any Promise that was rejected but not caught with
// .catch() or try/catch. These would otherwise silently fail.
// We log the error and shut the server down gracefully.
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 [Unhandled Promise Rejection]:', reason);
  // Close the server, then exit
  server.close(() => {
    process.exit(1);
  });
});


// ============================================================
// UNCAUGHT EXCEPTIONS
// ============================================================
// Catches synchronous errors thrown outside any try/catch.
// Example: JSON.parse() on invalid data at the top level.
// The process MUST exit after an uncaught exception — the app
// is in an unknown state and could behave unpredictably.
process.on('uncaughtException', (error) => {
  console.error('💥 [Uncaught Exception]:', error.message);
  process.exit(1);
});


// ============================================================
// GRACEFUL SHUTDOWN (SIGTERM / SIGINT)
// ============================================================
// SIGTERM is sent by:  PM2, Docker, Kubernetes, Render, Railway
// SIGINT  is sent by:  Ctrl+C in terminal (during development)
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  [${signal}] received. Closing server gracefully...`);

  server.close(() => {
    console.log('✅ HTTP server closed. Goodbye!');
    process.exit(0); // 0 = clean exit
  });

  // If server doesn't close within 10 s, force exit
  setTimeout(() => {
    console.error('❌ Server did not close in time. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
