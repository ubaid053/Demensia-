const http = require('http');
const fs = require('fs');
const path = require('path');
const analyticsService = require('./backend/analytics-service');

const PORT = process.env.PORT || 3000;

// Minimal demo auth key. Set CDX_API_KEY env var to override before deployment.
// Replace with full JWT middleware (jsonwebtoken + bcrypt) for production.
const API_KEY = process.env.CDX_API_KEY || 'gmch-demo-2026';

const DEMO_REQUESTS_PATH = path.join(__dirname, 'data', 'demo-requests.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/**
 * Minimal API auth guard.
 * Checks for x-api-key header. Returns false and writes 401 if key is missing/wrong.
 * NOTE: This is demo-tier auth — replace with JWT for production hospital deployment.
 */
function requireAuth(req, res) {
  const key = req.headers['x-api-key'] || '';
  if (key !== API_KEY) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Unauthorized. Provide a valid x-api-key header.' }));
    return false;
  }
  return true;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) { // 2MB max
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/** Load demo requests store (creates file if missing) */
function loadDemoRequests() {
  try {
    if (!fs.existsSync(DEMO_REQUESTS_PATH)) return { requests: [] };
    const raw = fs.readFileSync(DEMO_REQUESTS_PATH, 'utf8').replace(/^\uFEFF/, '').trim();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading demo-requests.json:', e);
    return { requests: [] };
  }
}

/** Persist demo requests store */
function saveDemoRequests(store) {
  try {
    const dir = path.dirname(DEMO_REQUESTS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DEMO_REQUESTS_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving demo-requests.json:', e);
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const reqPath = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  // CORS Headers for secure localhost testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  /* ============================================================
     DEMO REQUEST ROUTE — Public (no auth), landing page form
     POST /api/demo-request
     Persists institutional pilot requests to data/demo-requests.json
     ============================================================ */
  if (reqPath === '/api/demo-request' && req.method === 'POST') {
    try {
      const body = await readRequestBody(req);
      const { name, institution, role, contact, district, message } = body;

      // Validate required fields
      if (!name || !institution || !role || !contact || !district) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'name, institution, role, contact, and district are required.'
        }));
        return;
      }

      // Generate a unique reference code
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const refCode = `GMCH-DEMO-2026-${randNum}`;
      const submittedAt = new Date().toISOString();

      const newRequest = {
        refCode,
        submittedAt,
        name: name.trim(),
        institution: institution.trim(),
        role,
        contact: contact.trim(),
        district,
        message: (message || '').trim(),
        status: 'pending_review'
      };

      const store = loadDemoRequests();
      store.requests.unshift(newRequest);
      saveDemoRequests(store);

      console.log(`[Demo Request] ${refCode} — ${name} @ ${institution} (${district})`);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, refCode, submittedAt }));
      return;
    } catch (err) {
      console.error('Demo request error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
      return;
    }
  }

  /* ============================================================
     REST API ROUTER FOR PATIENT GAME ANALYTICS & REPORTS
     All routes require x-api-key authentication.
     ============================================================ */
  if (reqPath.startsWith('/api/analytics') || reqPath === '/api/patients') {
    // Auth gate — all analytics/patient routes require valid API key
    if (!requireAuth(req, res)) return;

    try {
      if (reqPath === '/api/patients' || reqPath === '/api/analytics/patients') {
        const store = analyticsService._loadStore();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, patients: store.patients || [] }));
        return;
      }

      if (reqPath === '/api/analytics/sessions' && req.method === 'GET') {
        const patientId = query.patientId;
        if (!patientId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'patientId parameter is required.' }));
          return;
        }
        const data = analyticsService.getSessions(query);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...data }));
        return;
      }

      if (reqPath === '/api/analytics/sessions' && req.method === 'POST') {
        const body = await readRequestBody(req);
        if (!body.patientId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'patientId is required in body.' }));
          return;
        }
        const session = analyticsService.recordSession(body);
        if (session.duplicatePrevented) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, duplicatePrevented: true, session }));
          return;
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, session }));
        return;
      }

      if (reqPath === '/api/analytics/summary' && req.method === 'GET') {
        const patientId = query.patientId;
        if (!patientId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'patientId parameter is required.' }));
          return;
        }
        const summary = analyticsService.getSummary(query);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, summary, ...summary }));
        return;
      }

      if (reqPath === '/api/analytics/notes' && req.method === 'GET') {
        const patientId = query.patientId;
        const sessionId = query.sessionId;
        if (!patientId && !sessionId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'patientId or sessionId parameter is required.' }));
          return;
        }
        const notes = analyticsService.getNotes(patientId, sessionId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, patientId, sessionId, notes }));
        return;
      }

      if (reqPath === '/api/analytics/notes' && req.method === 'POST') {
        const body = await readRequestBody(req);
        if (!body.patientId || (!body.note && !body.noteText)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'patientId and note content are required.' }));
          return;
        }
        const newNote = analyticsService.addNote(body);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, note: newNote }));
        return;
      }

      if (reqPath === '/api/analytics/export/csv' && req.method === 'GET') {
        const patientId = query.patientId || 'patient';
        const timeRange = query.timeRange || 'all';
        const csv = analyticsService.exportCSV(query);
        const filename = `patient-report-${patientId}-${timeRange}.csv`;
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        });
        res.end(csv);
        return;
      }

      if (reqPath === '/api/analytics/export/report' && req.method === 'GET') {
        const patientId = query.patientId || 'NER-2024-081';
        const html = analyticsService.exportReportHtml(query);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'API endpoint not found' }));
      return;
    } catch (apiErr) {
      console.error('API Router Error:', apiErr);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: apiErr.message || 'Internal Server Error' }));
      return;
    }
  }

  // Friendly Route Aliases - Unified Localhost Architecture
  let resolvedPath = reqPath;
  if (resolvedPath === '/' || resolvedPath === '/landing' || resolvedPath === '/about' || resolvedPath === '/public') {
    resolvedPath = '/landing.html';
  } else if (resolvedPath === '/doctor' || resolvedPath === '/dashboard' || resolvedPath === '/clinician') {
    resolvedPath = '/index.html';
  } else if (resolvedPath === '/games' || resolvedPath === '/patient' || resolvedPath === '/app') {
    resolvedPath = '/games.html';
  }
  
  const filePath = path.join(__dirname, resolvedPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[CDX-GERI-NER] Server listening on http://localhost:${PORT}`);
  console.log(`[CDX-GERI-NER] Demo API key: ${API_KEY} (set CDX_API_KEY env var to override)`);
});
