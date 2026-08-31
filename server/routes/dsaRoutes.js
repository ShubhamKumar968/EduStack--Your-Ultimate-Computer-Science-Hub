// ============================================================
// routes/dsaRoutes.js
// ============================================================
// PURPOSE:
//   Dedicated router for all DSA Sheet related endpoints.
//   Extracted from app.js for modularity.
//
// ENDPOINTS:
//   GET /api/dsa-sheet/sync  → Fetch live Google Sheet CSV, cache 5min
//   GET /api/dsa-sheet/live  → Fast: serve pre-parsed static JSON
// ============================================================

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const https   = require('https');
const router  = express.Router();

// ── In-Memory Cache ──────────────────────────────────────────
let _dsaSheetCache     = null;
let _dsaSheetCacheTime = 0;
const DSA_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSWl0OsRO5q5cdOUY3t--QiGg4WozIQVKBo9h2WrPyb5Rv7MC9DYt9bdap-6bGQLLlS0UsqKLJOhwaa/pub?gid=0&single=true&output=csv';

// ── CSV Fetcher (with redirect limit) ────────────────────────
/**
 * Fetch raw CSV text via HTTPS with bounded redirect following (max 5).
 */
function fetchCSV(url, redirectsLeft) {
  if (redirectsLeft === undefined) redirectsLeft = 5;
  return new Promise((resolve, reject) => {
    if (redirectsLeft < 0) return reject(new Error('Too many redirects fetching CSV'));
    const client = url.startsWith('https') ? https : require('http');
    client.get(url, { headers: { 'User-Agent': 'EduStack-Server/1.0' } }, (resp) => {
      if ([301, 302, 303, 307, 308].includes(resp.statusCode) && resp.headers.location) {
        return fetchCSV(resp.headers.location, redirectsLeft - 1).then(resolve).catch(reject);
      }
      if (resp.statusCode !== 200) {
        return reject(new Error('CSV fetch failed: HTTP ' + resp.statusCode));
      }
      let raw = '';
      resp.on('data', chunk => { raw += chunk; });
      resp.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

// ── CSV Parser ───────────────────────────────────────────────
function parseCSVText(text) {
  const lines = [];
  let row = [], inQ = false, cur = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"') {
      if (inQ && n === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      row.push(cur.trim()); cur = '';
    } else if ((c === '\r' || c === '\n') && !inQ) {
      if (c === '\r' && n === '\n') i++;
      row.push(cur.trim());
      if (row.some(v => v !== '')) lines.push(row);
      row = []; cur = '';
    } else {
      cur += c;
    }
  }
  if (cur || row.length > 0) { row.push(cur.trim()); if (row.some(v => v !== '')) lines.push(row); }
  return lines;
}

// ── Known companies list ─────────────────────────────────────
const KNOWN_COMPANIES = [
  'google', 'amazon', 'microsoft', 'meta', 'facebook', 'flipkart', 'adobe', 'apple', 'uber',
  'samsung', 'netflix', 'goldman sachs', 'goldman', 'oracle', 'paytm', 'visa', 'intuit', 'linkedin',
  'walmart', 'capgemini', 'ola', 'oyo', 'tcs', 'infosys', 'wipro', 'atlassian', 'paypal',
  'salesforce', 'morgan stanley', 'jp morgan', 'jpmorgan', 'swiggy', 'zomato', 'meesho', 'cred', 'phonepe',
  'byju', 'unacademy', 'accenture', 'cognizant', 'deloitte', 'ey', 'pwc', 'kpmg', 'ibm', 'cisco',
  'npci', 'mastercard', 'amex', 'barclays', 'hsbc', 'deutsche bank', 'standard chartered',
  'airtel', 'jio', 'tata', 'reliance', 'zoho', 'freshworks', 'postman', 'groww', 'zerodha',
  'upstox', 'slice', 'navi', 'bharatpe', 'dream11', 'mpl', 'urban company', 'makemytrip',
  'goibibo', 'cleartrip', 'cars24', 'spinny', 'inmobi', 'sharechat', 'dailyhunt', 'scaler',
  'snapdeal', 'media.net', 'bloomberg', 'vmware', 'nvidia', 'intel', 'amd', 'qualcomm', 'citadel',
  'jane street', 'two sigma', 'nutanix', 'rubrik', 'cohesity', 'servicenow', 'workday', 'twilio',
  'stripe', 'square', 'plaid', 'robinhood', 'coinbase', 'affirm', 'chime', 'klarna', 'revolut',
  'monzo', 'wise', 'instacart', 'doordash', 'grubhub', 'delivery hero', 'grab', 'gojek', 'shopee',
  'rakuten', 'line', 'kakao', 'naver', 'baidu', 'alibaba', 'tencent', 'bytedance', 'xiaomi',
  'huawei', 'didi', 'tech mahindra', 'mphasis', 'mindtree', 'persistent', 'kpit', 'cyient',
  'zensar', 'hexaware', 'tata elxsi', 'naukri', 'info edge', 'housing', 'magicbricks', 'nobroker',
  'urbancompany', 'dunzo', 'blinkit', 'zepto', 'bigbasket', 'grofers', 'nykaa', 'lenskart',
  'myntra', 'ajio', 'shopclues', 'firstcry', 'purplle', 'boat', 'noise', 'fireboltt', 'rapido',
  'redbus', 'yatra', 'easemytrip', 'ixigo', 'bookmyshow', 'pine labs', 'razorpay', 'cashfree',
  'billdesk', 'payu', 'juspay', 'instamojo', 'jupiter', 'fi', 'niyo', 'epifi', 'simpl', 'mobikwik'
];

/**
 * Strict check: returns true ONLY if ALL comma/slash-separated tokens
 * are known company names. This avoids false positives on short DSA hint text.
 */
function isOnlyCompanyNames(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim().replace(/^"|"$/g, '');
  if (!trimmed) return false;
  const parts = trimmed.split(/[,\/|;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every(part =>
    KNOWN_COMPANIES.some(comp => {
      if (comp.length <= 3) return part === comp;
      return part === comp || part.includes(comp);
    })
  );
}

// ── CSV-to-Problems converter ─────────────────────────────────
function csvLinesToProblems(lines, staticMap) {
  staticMap = staticMap || {};
  if (!lines || lines.length <= 1) return [];

  let currentCategory = 'Graphs';
  let currentSubtopic = '';
  const problems = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i];
    if (!cols || cols.length === 0) continue;

    if (cols[0] && cols[0].trim() &&
        !cols[0].toLowerCase().includes('sheet') &&
        !cols[0].toLowerCase().includes('edit') &&
        !cols[0].toLowerCase().includes('do not')) {
      currentCategory = cols[0].trim();
    }

    const col1 = (cols[1] || '').trim();
    const col2 = (cols[2] || '').trim();
    const col3 = (cols[3] || '').trim();

    if (col3.toLowerCase().includes('dsa sheet') ||
        col3.toLowerCase().includes('questions') ||
        col1.toLowerCase().includes('mark as done') ||
        col3.toLowerCase().includes('do not send')) {
      continue;
    }

    const lowerCol3 = col3.toLowerCase();
    const lowerCol0 = (cols[0] || '').toLowerCase();
    if (lowerCol3.includes('implementation based') ||
        lowerCol3.includes('conceptual video') ||
        lowerCol3.includes('algorithmic pattern') ||
        lowerCol0.includes('implementation based') ||
        lowerCol0.includes('conceptual video')) {
      continue;
    }

    const isIdNum = !isNaN(parseInt(col2)) && parseInt(col2) > 0;
    const col4Val = (cols[4] || '').trim();
    const isPlaceholderLink = col4Val === '' || col4Val === 'Problem Link';
    if (col3 && !isIdNum && (col1 === '' || col1 === 'FALSE' || col1 === 'TRUE') && isPlaceholderLink) {
      currentSubtopic = col3;
      continue;
    }

    const lowerCat = (currentCategory || '').toLowerCase();
    const lowerSub = (currentSubtopic || '').toLowerCase();
    if (lowerCat.includes('implementation based') ||
        lowerCat.includes('conceptual video') ||
        lowerSub.includes('implementation based') ||
        lowerSub.includes('conceptual video')) {
      continue;
    }

    if (col3 && isIdNum) {
      const id = problems.length + 1;
      const title = col3;
      const staticRef = staticMap[title.toLowerCase()] || {};

      const problemLink = (cols[4] || '').startsWith('http') ? cols[4].trim() : (staticRef.problemLink || '');
      const rawDiff = (cols[5] || '').trim();
      const difficulty = (rawDiff === 'Easy' || rawDiff === 'Medium' || rawDiff === 'Hard') ? rawDiff : (staticRef.difficulty || 'Medium');
      const github = (cols[6] || '').startsWith('http') ? cols[6].trim() : (staticRef.github || '');
      const video  = (cols[7] || '').startsWith('http') ? cols[7].trim() : (staticRef.video  || '');

      const compStr   = (cols[8] || '').trim();
      const companies = compStr
        ? compStr.split(/[,\/|]/).map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean)
        : (staticRef.companies || []);

      let rawIntuition = (cols[9] || '').trim();
      if (isOnlyCompanyNames(rawIntuition)) rawIntuition = '';
      let intuition = rawIntuition !== '' ? rawIntuition
        : (staticRef.intuition && staticRef.intuition !== 'Refer to problem logic & hints.' ? staticRef.intuition : '');
      if (isOnlyCompanyNames(intuition)) intuition = '';

      problems.push({
        id,
        title,
        category:  currentCategory  || staticRef.category || 'General',
        subTopic:  currentSubtopic  || staticRef.subTopic || '',
        difficulty,
        companies,
        problemLink,
        github,
        video,
        intuition,
        code: staticRef.code || ('// Logic & hint for: ' + title + '\n// Refer to problem link for full description.')
      });
    }
  }
  return problems;
}

// ── Route: Live sync from Google Sheets ──────────────────────
router.get('/sync', async (req, res) => {
  const jsonPath = path.join(__dirname, '../../client/public/parsed_problems.json');

  const isFresh = _dsaSheetCache && (Date.now() - _dsaSheetCacheTime < DSA_CACHE_TTL_MS);
  if (isFresh && !req.query.bust) {
    return res.status(200).json({
      success: true, source: 'cache',
      count: _dsaSheetCache.length,
      data: _dsaSheetCache,
      lastSynced: new Date(_dsaSheetCacheTime).toISOString()
    });
  }

  try {
    console.log('[DSA Sync] Fetching live data from Google Sheets...');
    const csvText  = await fetchCSV(GOOGLE_SHEET_CSV_URL);
    const csvLines = parseCSVText(csvText);

    let staticMap = {};
    try {
      if (fs.existsSync(jsonPath)) {
        const sp = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        sp.forEach(p => { if (p.title) staticMap[p.title.trim().toLowerCase()] = p; });
      }
    } catch (e) { /* non-fatal */ }

    const liveProblems = csvLinesToProblems(csvLines, staticMap);

    if (liveProblems && liveProblems.length > 5) {
      let mergedProblems = liveProblems;
      try {
        if (fs.existsSync(jsonPath)) {
          const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          const existingMap  = {};
          existingData.forEach(p => { if (p.title) existingMap[p.title.trim().toLowerCase()] = p; });
          mergedProblems = liveProblems.map(lp => {
            const ex = existingMap[lp.title.trim().toLowerCase()] || {};
            return {
              ...lp,
              problemLink: lp.problemLink || ex.problemLink || '',
              github:      lp.github      || ex.github      || '',
              video:       lp.video       || ex.video       || '',
            };
          });
        }
      } catch (mergeErr) {
        console.warn('[DSA Sync] Merge failed, using live data:', mergeErr.message);
      }

      _dsaSheetCache     = mergedProblems;
      _dsaSheetCacheTime = Date.now();

      // Async disk write — never blocks event loop
      fs.writeFile(jsonPath, JSON.stringify(mergedProblems, null, 2), 'utf-8', (writeErr) => {
        if (writeErr) console.warn('[DSA Sync] Could not write parsed_problems.json:', writeErr.message);
        else console.log('[DSA Sync] Wrote ' + mergedProblems.length + ' problems to disk.');
      });

      return res.status(200).json({
        success: true, source: 'live',
        count: mergedProblems.length,
        data: mergedProblems,
        lastSynced: new Date().toISOString()
      });
    }

    throw new Error('Parsed 0 problems from live sheet — falling back');
  } catch (liveErr) {
    console.warn('[DSA Sync] Live fetch failed, using static file:', liveErr.message);
    try {
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        _dsaSheetCache     = data;
        _dsaSheetCacheTime = Date.now();
        return res.status(200).json({
          success: true, source: 'cached-file',
          count: data.length, data,
          lastSynced: new Date().toISOString()
        });
      }
      return res.status(200).json({ success: true, source: 'empty', count: 0, data: [] });
    } catch (fsErr) {
      console.error('[DSA Sync] Static fallback failed:', fsErr.message);
      return res.status(500).json({ success: false, error: fsErr.message });
    }
  }
});

// ── Route: Fast static JSON serve ────────────────────────────
router.get('/live', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const jsonPath = path.join(__dirname, '../../client/public/parsed_problems.json');
    const lecPath  = path.join(__dirname, '../../client/public/parsed_lectures.json');

    let data = [], lectures = [];
    if (fs.existsSync(jsonPath)) data     = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    if (fs.existsSync(lecPath))  lectures = JSON.parse(fs.readFileSync(lecPath,  'utf-8'));

    return res.status(200).json({
      success: true, count: data.length, data, lectures,
      lastSynced: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
