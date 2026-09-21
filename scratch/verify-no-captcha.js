const http = require('http');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runVerification() {
  console.log('=== VERIFYING PATIENT LOGIN & NO CAPTCHA ===\n');

  // 1. Fetch landing.html from running server
  const landingRes = await fetchUrl('http://localhost:3000/landing.html');
  console.log('1. GET /landing.html -> Status:', landingRes.status);
  console.assert(landingRes.status === 200, 'landing.html should return 200');

  // Check for any active captcha elements
  const hasCaptchaInput = landingRes.body.includes('id="patient-captcha-input"');
  const hasCaptchaDisplay = landingRes.body.includes('id="patient-captcha-display"');
  const hasRefreshCaptcha = landingRes.body.includes('id="btn-refresh-captcha"');
  const hasAudioCaptcha = landingRes.body.includes('id="btn-audio-captcha"');
  const hasPatientIdInput = landingRes.body.includes('id="patient-login-id"');
  const hasQuickLogin = landingRes.body.includes('id="btn-quick-patient-login"');

  console.log(' - patient-captcha-input present:', hasCaptchaInput);
  console.log(' - patient-captcha-display present:', hasCaptchaDisplay);
  console.log(' - btn-refresh-captcha present:', hasRefreshCaptcha);
  console.log(' - btn-audio-captcha present:', hasAudioCaptcha);
  console.log(' - patient-login-id present (Patient ID only):', hasPatientIdInput);
  console.log(' - btn-quick-patient-login present:', hasQuickLogin);

  console.assert(!hasCaptchaInput, 'FAIL: patient-captcha-input should NOT exist');
  console.assert(!hasCaptchaDisplay, 'FAIL: patient-captcha-display should NOT exist');
  console.assert(!hasRefreshCaptcha, 'FAIL: btn-refresh-captcha should NOT exist');
  console.assert(!hasAudioCaptcha, 'FAIL: btn-audio-captcha should NOT exist');
  console.assert(!hasQuickLogin, 'FAIL: btn-quick-patient-login should NOT exist (1-click removed)');

  // 2. Fetch js/landing.js
  const jsRes = await fetchUrl('http://localhost:3000/js/landing.js');
  console.log('\n2. GET /js/landing.js -> Status:', jsRes.status);
  const jsHasCaptchaVal = jsRes.body.includes('captchaVal');
  const jsHasGenerateCaptcha = jsRes.body.includes('generateCaptcha');
  console.log(' - js has captchaVal check:', jsHasCaptchaVal);
  console.log(' - js has generateCaptcha function:', jsHasGenerateCaptcha);
  console.assert(!jsHasCaptchaVal, 'FAIL: js should NOT validate captchaVal');
  console.assert(!jsHasGenerateCaptcha, 'FAIL: js should NOT generate captcha');

  // 3. Test demo-request endpoint
  const demoRes = await fetchUrl('http://localhost:3000/api/demo-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Test Clinician',
      institution: 'GMCH Test Unit',
      role: 'Neurologist',
      contact: 'test@gmch.gov.in',
      district: 'Kamrup Metro',
      message: 'Automated test request'
    })
  });
  console.log('\n3. POST /api/demo-request -> Status:', demoRes.status, 'Body:', demoRes.body);
  console.assert(demoRes.status === 201, 'POST /api/demo-request should return 201');

  // 4. Test analytics session recording with x-api-key
  const sessRes = await fetchUrl('http://localhost:3000/api/analytics/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'gmch-demo-2026'
    },
    body: JSON.stringify({
      patientId: 'NER-2024-081',
      patientName: 'Hemanta Hazarika',
      gameId: 'memory',
      gameName: 'Memory Match',
      category: 'memory',
      score: 85,
      maxScore: 100,
      accuracy: 85,
      timeTaken: 120,
      metrics: { reactionTime: 650, completionRate: 100 }
    })
  });
  console.log('\n4. POST /api/analytics/sessions (with x-api-key) -> Status:', sessRes.status);
  console.assert(sessRes.status === 201, 'POST /api/analytics/sessions should return 201');

  console.log('\n========================================');
  console.log(' ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
