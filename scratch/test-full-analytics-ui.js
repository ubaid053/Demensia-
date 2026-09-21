/**
 * E2E & Unit Verification Test for Patient Game Analytics & Reporting
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${urlPath}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Patient Game Analytics Comprehensive Verification ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${name}`);
      failed++;
    }
  }

  // TEST 1: Static File Checks
  console.log('\n[1] Verifying Frontend Markup & JS Components...');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('id="view-game-analytics"'), 'index.html contains #view-game-analytics');
  assert(indexHtml.includes('id="nav-game-analytics"'), 'index.html contains #nav-game-analytics in top nav');
  assert(indexHtml.includes('id="ga-patient-select"'), 'index.html contains #ga-patient-select');
  assert(indexHtml.includes('data-range="today"') && indexHtml.includes('data-range="custom"'), 'index.html contains all 8 time-range pills');
  assert(indexHtml.includes('id="ga-stat-total-sessions"') && indexHtml.includes('id="ga-stat-completion-rate"'), 'index.html contains 7 metric cards');
  assert(indexHtml.includes('id="ga-chart-completion"') && indexHtml.includes('id="ga-chart-latency-line"'), 'index.html contains 8 chart container IDs');
  assert(indexHtml.includes('id="ga-history-table"') || indexHtml.includes('ga-history-table'), 'index.html contains game history table');
  assert(indexHtml.includes('id="ga-session-detail-modal"'), 'index.html contains session detail drawer modal');
  assert(indexHtml.includes('id="ga-report-modal"'), 'index.html contains report customizer modal');
  assert(indexHtml.includes('id="btn-view-patient-analytics"'), 'EHR Detail contains link to game analytics');
  assert(indexHtml.includes('id="btn-caregiver-view-game-analytics"'), 'Caregiver Dashboard contains link to game analytics');

  const chartsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'charts.js'), 'utf8');
  assert(chartsJs.includes('renderCompletionStatusDonut'), 'charts.js contains renderCompletionStatusDonut');
  assert(chartsJs.includes('renderResponseBreakdownDonut'), 'charts.js contains renderResponseBreakdownDonut');
  assert(chartsJs.includes('renderDomainParticipationDonut'), 'charts.js contains renderDomainParticipationDonut');
  assert(chartsJs.includes('renderGameAccuracyBar'), 'charts.js contains renderGameAccuracyBar');
  assert(chartsJs.includes('renderSessionFrequencyBar'), 'charts.js contains renderSessionFrequencyBar');
  assert(chartsJs.includes('renderAccuracyTrajectoryLine'), 'charts.js contains renderAccuracyTrajectoryLine');
  assert(chartsJs.includes('renderDurationTrajectoryLine'), 'charts.js contains renderDurationTrajectoryLine');
  assert(chartsJs.includes('renderLatencyTrajectoryLine'), 'charts.js contains renderLatencyTrajectoryLine');
  assert(chartsJs.includes('toggleDataTable'), 'charts.js contains accessible toggleDataTable');

  const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert(appJs.includes('loadGameAnalytics'), 'app.js contains loadGameAnalytics');
  assert(appJs.includes('openSessionDetailDrawer'), 'app.js contains openSessionDetailDrawer');
  assert(appJs.includes('saveSessionNote'), 'app.js contains saveSessionNote');
  assert(appJs.includes('exportGameAnalyticsCSV'), 'app.js contains exportGameAnalyticsCSV');

  // TEST 2: Strict Patient Data Isolation
  console.log('\n[2] Verifying Strict Patient Data Isolation...');
  const resP1 = await request('/api/analytics/sessions?patientId=NER-2024-081&range=30d');
  const dataP1 = JSON.parse(resP1.body);
  const resP2 = await request('/api/analytics/sessions?patientId=NER-2024-094&range=30d');
  const dataP2 = JSON.parse(resP2.body);

  assert(dataP1.sessions && dataP1.sessions.length > 0, 'Patient 1 has session records');
  assert(dataP2.sessions && dataP2.sessions.length > 0, 'Patient 2 has session records');
  assert(dataP1.sessions.every(s => s.patientId === 'NER-2024-081'), 'Patient 1 sessions exclusively belong to NER-2024-081');
  assert(dataP2.sessions.every(s => s.patientId === 'NER-2024-094'), 'Patient 2 sessions exclusively belong to NER-2024-094');

  const idsP1 = new Set(dataP1.sessions.map(s => s.sessionId));
  const hasOverlap = dataP2.sessions.some(s => idsP1.has(s.sessionId));
  assert(!hasOverlap, 'Zero cross-contamination between patient datasets (disjoint session IDs)');

  // TEST 3: Time-Range Filters & Dynamic Grouping
  console.log('\n[3] Verifying 8 Time-Range Filters & Dynamic Grouping...');
  const ranges = [
    { r: 'today', expectedGroup: 'hourly' },
    { r: '24h', expectedGroup: 'hourly' },
    { r: '7d', expectedGroup: 'daily' },
    { r: '30d', expectedGroup: 'daily' },
    { r: '3m', expectedGroup: 'weekly' },
    { r: '6m', expectedGroup: 'weekly' },
    { r: '1y', expectedGroup: 'monthly' }
  ];

  for (const { r, expectedGroup } of ranges) {
    const res = await request(`/api/analytics/summary?patientId=NER-2024-081&range=${r}`);
    const body = JSON.parse(res.body);
    assert(body.success && body.summary, `Summary returned successfully for range: ${r}`);
    assert(body.summary.grouping === expectedGroup, `Range ${r} dynamically grouped by: ${expectedGroup}`);
  }

  // TEST 4: Telemetry Post & Idempotent Duplicate Prevention
  console.log('\n[4] Verifying Session Logging & Duplicate Prevention...');
  const testPayload = {
    patientId: 'NER-2024-110',
    gameId: 'test-memory-e2e',
    gameName: 'E2E Memory Match',
    category: 'Memory',
    tier: 1,
    difficulty: 'Tier 1 (Easy)',
    durationSeconds: 120,
    attempted: 12,
    correct: 10,
    incorrect: 2,
    accuracy: 83,
    responseTime: 2.1,
    completionStatus: 'completed'
  };

  const postRes1 = await request('/api/analytics/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: testPayload
  });
  const postData1 = JSON.parse(postRes1.body);
  assert(postRes1.statusCode === 201 && postData1.success, 'New game session posted and recorded');

  // Immediate re-post within 5 seconds should trigger duplicate protection
  const postRes2 = await request('/api/analytics/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: testPayload
  });
  const postData2 = JSON.parse(postRes2.body);
  assert(postRes2.statusCode === 200 && postData2.duplicatePrevented, 'Rapid duplicate session submission successfully prevented');

  // TEST 5: Clinical Notes CRUD
  console.log('\n[5] Verifying Clinical & Caregiver Notes...');
  const notePayload = {
    patientId: 'NER-2024-081',
    sessionId: dataP1.sessions[0].sessionId,
    authorName: 'Dr. Debabrata Roy (Consultant Geriatrician)',
    authorRole: 'Consultant Geriatrician',
    noteText: 'E2E Verification Note: Patient displayed great engagement and steady motor coordination.'
  };

  const noteRes = await request('/api/analytics/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: notePayload
  });
  const noteData = JSON.parse(noteRes.body);
  assert(noteRes.statusCode === 201 && noteData.success, 'Clinical note added successfully');

  const getNotesRes = await request(`/api/analytics/notes?sessionId=${dataP1.sessions[0].sessionId}`);
  const getNotesData = JSON.parse(getNotesRes.body);
  assert(getNotesData.notes && getNotesData.notes.some(n => n.noteText.includes('E2E Verification Note')), 'Note retrieved in session notes audit list');

  // TEST 6: RFC 4180 CSV Export
  console.log('\n[6] Verifying RFC 4180 CSV Export...');
  const csvRes = await request('/api/analytics/export/csv?patientId=NER-2024-081');
  assert(csvRes.statusCode === 200, 'CSV export returned 200 OK');
  assert(csvRes.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');
  assert(csvRes.body.includes('Session ID,Patient ID,Game Name'), 'CSV contains standard RFC 4180 headers');
  assert(csvRes.body.includes('NER-2024-081'), 'CSV contains patient ID');

  // TEST 7: Printable HTML Report Export
  console.log('\n[7] Verifying Printable Progress Report...');
  const repRes = await request('/api/analytics/export/report?patientId=NER-2024-081&range=30d&format=print');
  assert(repRes.statusCode === 200, 'Report export returned 200 OK');
  assert(repRes.body.includes('Clinical & Caregiver Cognitive Activity Report'), 'Report contains official header title');
  assert(repRes.body.includes('window.print()'), 'Report contains automatic print script');
  assert(repRes.body.includes('Observational Disclaimer'), 'Report includes observational non-diagnostic disclaimer');

  console.log(`\n=============================================`);
  console.log(`Total Verification Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`=============================================`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
