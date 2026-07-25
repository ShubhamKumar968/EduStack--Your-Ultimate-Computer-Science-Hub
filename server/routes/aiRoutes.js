// ============================================================
// aiRoutes.js — Proxy Routes to EduStack ML & RAG Microservice
// ============================================================

const express = require('express');
const router = express.Router();
const http = require('http');
const https = require('https');
const multer = require('multer');
const FormData = require('form-data');

const upload = multer({ storage: multer.memoryStorage() });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Helper function to send JSON requests to FastAPI
const postToMLService = (endpoint, payload) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${ML_SERVICE_URL}${endpoint}`);
    const data = JSON.stringify(payload);

    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
};

// ── RAG Ask Endpoint Proxy ──────────────────────────────────
router.post('/ask', async (req, res, next) => {
  try {
    const result = await postToMLService('/api/rag/ask', req.body);
    return res.status(result.status).json(result.data);
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'ML RAG Microservice is currently offline. Please ensure Python service is running on port 8000.',
      error: err.message
    });
  }
});

// ── PYQ Generator Proxy ────────────────────────────────────
router.post('/generate-pyq', async (req, res, next) => {
  try {
    const result = await postToMLService('/api/rag/generate-pyq', req.body);
    return res.status(result.status).json(result.data);
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'ML RAG Microservice offline.',
      error: err.message
    });
  }
});

// ── PDF Summarizer Proxy ───────────────────────────────────
router.post('/pdf/summarize', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const url = new URL(`${ML_SERVICE_URL}/api/pdf/summarize`);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: form.getHeaders()
    };

    const proxyReq = client.request(options, (proxyRes) => {
      let body = '';
      proxyRes.on('data', (chunk) => body += chunk);
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          res.status(proxyRes.statusCode).json(parsed);
        } catch (e) {
          res.status(proxyRes.statusCode).send(body);
        }
      });
    });

    proxyReq.on('error', (err) => {
      res.status(503).json({ success: false, message: 'ML RAG Service offline.', error: err.message });
    });

    form.pipe(proxyReq);
  } catch (err) {
    next(err);
  }
});

// ── PDF Quiz Generator Proxy ──────────────────────────────
router.post('/pdf/generate-quiz', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    }

    const numQuestions = req.query.num_questions || 5;

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const url = new URL(`${ML_SERVICE_URL}/api/pdf/generate-quiz?num_questions=${numQuestions}`);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: form.getHeaders()
    };

    const proxyReq = client.request(options, (proxyRes) => {
      let body = '';
      proxyRes.on('data', (chunk) => body += chunk);
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          res.status(proxyRes.statusCode).json(parsed);
        } catch (e) {
          res.status(proxyRes.statusCode).send(body);
        }
      });
    });

    proxyReq.on('error', (err) => {
      res.status(503).json({ success: false, message: 'ML RAG Service offline.', error: err.message });
    });

    form.pipe(proxyReq);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
