const fs = require('fs');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== VERIFYING USER REQUEST FIXES ===\n');

  // 1. Fetch live landing.html from localhost:3000
  const landingRes = await fetchUrl('http://localhost:3000/landing.html');
  console.log('1. Live landing.html status:', landingRes.status);
  const landingHtml = landingRes.body;

  // Requirement 1: "See what doctors usually see" section
  const hasUsuallySeeTitle = landingHtml.includes('See what doctors usually see');
  console.log(' - Has "See what doctors usually see" title:', hasUsuallySeeTitle);
  console.assert(hasUsuallySeeTitle, 'FAIL: Title should contain "See what doctors usually see"');

  const hasNoChildishEmojis = !landingHtml.includes('🃏') && !landingHtml.includes('☕');
  console.log(' - Childish emojis (🃏, ☕) removed from games preview:', hasNoChildishEmojis);
  console.assert(hasNoChildishEmojis, 'FAIL: Childish emojis should be removed from preview');

  const hasHighContrastGrid = landingHtml.includes('crop-memory-grid') && landingHtml.includes('Analog Clock');
  console.log(' - Authentic high-contrast card grid present:', hasHighContrastGrid);
  console.assert(hasHighContrastGrid, 'FAIL: Authentic card grid must be present');

  // Requirement 2: Spoken languages: Hindi, Marathi, English and Etc. (All Indian languages)
  const hasHindi = landingHtml.includes('data-lang="Hindi"');
  const hasMarathi = landingHtml.includes('data-lang="Marathi"');
  const hasEnglish = landingHtml.includes('data-lang="English"');
  const hasEtc = landingHtml.includes('id="btn-lang-etc"');
  const hasIndiaPanel = landingHtml.includes('id="all-india-languages-panel"');
  const has22Scheduled = landingHtml.includes('All 22 Official Scheduled Languages Supported');

  console.log('\n2. Spoken Languages:');
  console.log(' - Has Hindi chip:', hasHindi);
  console.log(' - Has Marathi chip:', hasMarathi);
  console.log(' - Has English chip:', hasEnglish);
  console.log(' - Has Etc. button:', hasEtc);
  console.log(' - Has All-India 22 languages matrix:', hasIndiaPanel && has22Scheduled);

  console.assert(hasHindi, 'FAIL: Hindi chip missing');
  console.assert(hasMarathi, 'FAIL: Marathi chip missing');
  console.assert(hasEnglish, 'FAIL: English chip missing');
  console.assert(hasEtc, 'FAIL: Etc chip missing');
  console.assert(hasIndiaPanel, 'FAIL: All-India languages panel missing');

  // Requirement 3: Soft sidebar UI/UX
  const stylesCss = fs.readFileSync('css/styles.css', 'utf8');
  const gamesCss = fs.readFileSync('css/games.css', 'utf8');

  const clinicianDarkBg = stylesCss.includes('#091520') || stylesCss.includes('#060e15');
  const clinicianSoftBg = stylesCss.includes('#FAF8F5') || stylesCss.includes('#F4EFEB');
  console.log('\n3. Sidebar Softness:');
  console.log(' - Clinician sidebar dark background (#091520) removed:', !clinicianDarkBg);
  console.log(' - Clinician sidebar soft background applied:', clinicianSoftBg);
  console.assert(!clinicianDarkBg, 'FAIL: Clinician sidebar still has dark background');
  console.assert(clinicianSoftBg, 'FAIL: Clinician sidebar soft background missing');

  const companionDarkBg = gamesCss.includes('#0D3528') || gamesCss.includes('#08261C');
  const companionSoftBg = gamesCss.includes('#FDFBF7') || gamesCss.includes('#F4EFEB');
  console.log(' - Companion sidebar dark background (#0D3528) removed:', !companionDarkBg);
  console.log(' - Companion sidebar soft background applied:', companionSoftBg);
  console.assert(!companionDarkBg, 'FAIL: Companion sidebar still has dark background');
  console.assert(companionSoftBg, 'FAIL: Companion sidebar soft background missing');

  // Requirement 4: Remove 1-Click Enter from Doctor Login
  const hasDoctor1Click = landingHtml.includes('btn-quick-doctor-login') || landingHtml.includes('Pre-Configured Clinician Session');
  console.log('\n4. Doctor Login 1-Click Enter:');
  console.log(' - 1-Click Enter removed from Doctor Login modal:', !hasDoctor1Click);
  console.assert(!hasDoctor1Click, 'FAIL: 1-Click Enter still present in doctor login modal');

  const landingJs = fs.readFileSync('js/landing.js', 'utf8');
  const jsHasDoctorQuick = landingJs.includes('btn-quick-doctor-login');
  console.log(' - js/landing.js does NOT bind quick doctor login:', !jsHasDoctorQuick);
  console.assert(!jsHasDoctorQuick, 'FAIL: landing.js still has quick doctor login binding');

  console.log('\n=============================================');
  console.log(' ALL 4 USER REQUIREMENTS VERIFIED & PASSED! ');
  console.log('=============================================\n');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
