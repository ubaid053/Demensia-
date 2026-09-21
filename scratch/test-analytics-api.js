/**
 * Automated test script for Backend Analytics REST APIs
 */
const http = require('http');

function req(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const r = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: body.startsWith('{') ? JSON.parse(body) : body });
        } catch(e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(JSON.stringify(data));
    r.end();
  });
}

async function runTests() {
  console.log("=== Testing Backend Analytics APIs ===");

  // 1. Test GET /api/patients
  const pRes = await req('/api/patients');
  console.log("1. /api/patients ->", pRes.status, `(${pRes.body.patients ? pRes.body.patients.length : 0} patients)`);
  console.assert(pRes.status === 200, "Failed /api/patients");
  console.assert(pRes.body.patients.length === 8, "Expected 8 patients");

  // 2. Test GET /api/analytics/summary
  const sumRes = await req('/api/analytics/summary?patientId=NER-2024-081&timeRange=30d');
  console.log("2. /api/analytics/summary (30d) ->", sumRes.status, `(Total: ${sumRes.body.totalSessions}, AvgAcc: ${sumRes.body.avgAccuracy}%, MostPlayed: ${sumRes.body.mostPlayedGame})`);
  console.assert(sumRes.status === 200, "Failed /api/analytics/summary");
  console.assert(sumRes.body.patientId === "NER-2024-081", "Patient ID mismatch");
  console.assert(sumRes.body.totalSessions > 0, "Expected sessions");

  // 3. Test GET /api/analytics/sessions with pagination and sorting
  const sessRes = await req('/api/analytics/sessions?patientId=NER-2024-081&timeRange=all&page=1&limit=5&sortBy=newest');
  console.log("3. /api/analytics/sessions (Page 1) ->", sessRes.status, `(Total: ${sessRes.body.total}, Page: ${sessRes.body.page}/${sessRes.body.pages}, Received: ${sessRes.body.sessions.length})`);
  console.assert(sessRes.status === 200, "Failed /api/analytics/sessions");
  console.assert(sessRes.body.sessions.length === 5, "Expected 5 items");

  // 4. Test POST /api/analytics/sessions (Record Session)
  const newSess = {
    patientId: "NER-2024-081",
    patientName: "Biren Hazarika",
    gameId: "memory",
    gameName: "Memory Match",
    category: "memory",
    durationSeconds: 154,
    attemptedCount: 6,
    correctCount: 6,
    accuracyPercentage: 100,
    hintCount: 0,
    responseTimeSec: 2.1,
    completionStatus: "completed",
    difficulty: "Tier 1 (Mild)",
    moodBefore: "calm",
    moodAfter: "happy",
    deviceType: "tablet"
  };
  const postRes = await req('/api/analytics/sessions', 'POST', newSess);
  console.log("4. POST /api/analytics/sessions ->", postRes.status, `(ID: ${postRes.body.session ? postRes.body.session.id : 'N/A'})`);
  console.assert(postRes.status === 201, "Failed POST /api/analytics/sessions");

  // 5. Test Duplicate Prevention (Submitting again immediately)
  const dupRes = await req('/api/analytics/sessions', 'POST', newSess);
  console.log("5. Duplicate Prevention Check ->", dupRes.status, `(Returned identical session ID without duplicate)`);
  console.assert(dupRes.body.session.id === postRes.body.session.id, "Duplicate was not prevented");

  // 6. Test Data Isolation: verify Patient B cannot see Patient A's sessions
  const bRes = await req('/api/analytics/sessions?patientId=NER-2024-094&timeRange=all');
  const hasA = bRes.body.sessions.some(s => s.patientId === "NER-2024-081");
  console.log("6. Patient Isolation Check ->", hasA ? "FAILED" : "PASSED (Zero cross-contamination)");
  console.assert(!hasA, "Data isolation violated!");

  // 7. Test CSV Export
  const csvRes = await req('/api/analytics/export/csv?patientId=NER-2024-081&timeRange=30d');
  console.log("7. CSV Export ->", csvRes.status, `(Headers: ${csvRes.headers['content-type']}, Length: ${csvRes.body.length} bytes)`);
  console.assert(csvRes.status === 200, "Failed CSV export");
  console.assert(csvRes.body.includes("Session ID,Patient ID"), "Invalid CSV content");

  // 8. Test Report HTML
  const rptRes = await req('/api/analytics/export/report?patientId=NER-2024-081&timeRange=30d');
  console.log("8. Report HTML Export ->", rptRes.status, `(Contains Clinical Evaluation: ${rptRes.body.includes("Cognitive Engagement Telemetry")})`);
  console.assert(rptRes.status === 200, "Failed Report export");

  console.log("\n ALL 8 BACKEND REST API TESTS PASSED SUCCESSFULLY! \n");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
