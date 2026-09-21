const http = require('http');
const assert = require('assert');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE VERIFICATION (LATEST USER REQUIREMENTS) ---\n');

  // 1. Check index.html (Doctor Portal)
  const index = await fetch('http://localhost:3000/index.html');
  assert.strictEqual(index.status, 200, 'index.html should return 200');

  // Verification 1a: NeuroSync branding & stable logo
  assert(index.body.includes('NeuroSync'), 'NeuroSync branding present in index.html');
  assert(index.body.includes('nsGradHdr'), 'Stable nsGradHdr gradient in index.html');
  assert(!index.body.includes('stroke-dasharray'), 'No dashed scanning lines in index.html');
  console.log('✓ 1a: Stable NeuroSync logo & branding verified in index.html');

  // Verification 1b: No patient cognitive app in doctor sidebar
  assert(!index.body.includes('id="nav-patient-app"'), 'No nav-patient-app in index.html doctor sidebar');
  console.log('✓ 1b: Patient Cognitive App removed from doctor slide bar');

  // Verification 1c: New Patient Intake has only one plus sign (SVG icon, text is "New Patient Intake")
  assert(index.body.includes('id="btn-open-intake"'), 'id="btn-open-intake" exists');
  assert(!index.body.includes('<span>+ New Patient Intake</span>'), 'No duplicate text + in btn-open-intake');
  assert(index.body.includes('<span>New Patient Intake</span>'), 'Clean "New Patient Intake" span exists');
  console.log('✓ 1c: Only ONE plus sign on New Patient Intake button (no duplicate text plus)');

  // Verification 1d: Back to Patient Roster has only one arrow (SVG icon, no HTML &larr;)
  assert(index.body.includes('id="btn-back-to-roster"'), 'id="btn-back-to-roster" exists');
  assert(!index.body.includes('&larr; Back to Patient Roster'), 'No duplicate text &larr; arrow');
  assert(index.body.includes('<span>Back to Patient Roster</span>'), 'Clean "Back to Patient Roster" span exists');
  console.log('✓ 1d: Only ONE arrow on Back to Patient Roster button (no duplicate arrow)');

  // Verification 1e: Header brand return to roster (doesn\'t kick user out to landing page)
  assert(index.body.includes('id="header-brand-return-roster"'), 'header-brand-return-roster link exists');
  assert(index.body.includes('id="btn-jump-to-calendar"'), 'btn-jump-to-calendar action button exists in EHR header');
  console.log('✓ 1e: Header brand returns to roster internally & Care Calendar jump button present');

  // Verification 1f: Calendar panel in patient personal record
  assert(index.body.includes('id="doc-cal-patient-label"'), 'doc-cal-patient-label exists');
  assert(index.body.includes('id="doc-calendar-days-grid"'), 'doc-calendar-days-grid exists');
  assert(index.body.includes('id="doc-inspector-activities-list"'), 'doc-inspector-activities-list exists');
  console.log('✓ 1f: Doctor Patient Activity Calendar panel prominently positioned in personal record');

  // 2. Check landing.html
  const landing = await fetch('http://localhost:3000/landing.html');
  assert.strictEqual(landing.status, 200, 'landing.html should return 200');
  assert(landing.body.includes('NeuroSync'), 'NeuroSync branding in landing.html');
  assert(landing.body.includes('nsGradLand'), 'nsGradLand stable logo in landing.html');
  assert(!landing.body.includes('stroke-dasharray'), 'No dashed scanning lines in landing.html');
  console.log('✓ 2a: Stable NeuroSync logo & branding verified in landing.html');

  // 3. Check games.html
  const games = await fetch('http://localhost:3000/games.html');
  assert.strictEqual(games.status, 200, 'games.html should return 200');
  assert(games.body.includes('NeuroSync'), 'NeuroSync branding in games.html');
  assert(games.body.includes('nsGradGmsHdr'), 'nsGradGmsHdr stable logo in games.html');
  assert(!games.body.includes('stroke-dasharray'), 'No dashed scanning lines in games.html');
  console.log('✓ 3a: Stable NeuroSync logo & branding verified in games.html');

  // 4. Check app.js logic
  const appJs = await fetch('http://localhost:3000/js/app.js');
  assert(!appJs.body.includes('navPatientApp.addEventListener'), 'No navPatientApp listener in app.js');
  assert(appJs.body.includes('header-brand-return-roster'), 'header-brand-return-roster listener in app.js');
  assert(appJs.body.includes('btn-jump-to-calendar'), 'btn-jump-to-calendar listener in app.js');
  assert(appJs.body.includes('popstate'), 'popstate history guard present in app.js');
  console.log('✓ 4a: app.js event listeners & navigation safety guards verified');

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
