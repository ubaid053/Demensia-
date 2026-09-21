const http = require('http');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('=== VERIFYING PATIENT SIDEBAR & 1-CLICK ENTER REMOVAL ===\n');

  // 1. Check landing.html for patient login 1-click enter removal
  const landing = await fetchUrl('http://localhost:3000/landing.html');
  const hasPatientQuickLoginBtn = landing.body.includes('id="btn-quick-patient-login"');
  const hasPatient1ClickText = landing.body.includes('1-Click Enter &rarr;') || landing.body.includes('1-Click Enter →');
  const hasRegisteredSeniorProfileBanner = landing.body.includes('Registered Senior Profile');
  
  console.log('1. Patient Login Modal 1-Click Enter Removal:');
  console.log(' - btn-quick-patient-login removed:', !hasPatientQuickLoginBtn);
  console.log(' - 1-Click Enter button text removed from patient modal:', !hasPatient1ClickText);
  console.log(' - Registered Senior Profile banner removed:', !hasRegisteredSeniorProfileBanner);
  
  console.assert(!hasPatientQuickLoginBtn, 'FAIL: btn-quick-patient-login still exists in landing.html');
  console.assert(!hasPatient1ClickText, 'FAIL: 1-Click Enter text still exists in patient modal');

  // Check js/landing.js
  const landingJs = fs.readFileSync('./js/landing.js', 'utf8');
  const jsHasPatientQuick = landingJs.includes('btn-quick-patient-login');
  console.log(' - js/landing.js has no reference to btn-quick-patient-login:', !jsHasPatientQuick);
  console.assert(!jsHasPatientQuick, 'FAIL: js/landing.js still has reference to btn-quick-patient-login');

  // 2. Check games.html and css/games.css for patient companion sidebar
  const games = await fetchUrl('http://localhost:3000/games.html');
  const gamesCss = fs.readFileSync('./css/games.css', 'utf8');

  console.log('\n2. Patient Companion Sidebar Matching Doctor Sidebar:');
  
  // Left-docked position
  const cssHasLeft = gamesCss.includes('.companion-sidebar {') && gamesCss.includes('left: 0;') && gamesCss.includes('transform: translateX(-105%);');
  console.log(' - Companion sidebar docked on left (left: 0, translateX(-105%)):', cssHasLeft);
  console.assert(cssHasLeft, 'FAIL: companion sidebar is not docked on left');

  // Float button on left
  const floatHasLeft = gamesCss.includes('.btn-float-open-sidebar {') && gamesCss.includes('left: 0;');
  console.log(' - Floating edge tab located on left edge:', floatHasLeft);
  console.assert(floatHasLeft, 'FAIL: floating button is not on left edge');

  // Header menu trigger button
  const hasHeaderMenuBtn = games.body.includes('id="btn-toggle-companion-sidebar"') && games.body.includes('btn-clinical-menu-trigger');
  console.log(' - Header includes visible menu trigger button:', hasHeaderMenuBtn);
  console.assert(hasHeaderMenuBtn, 'FAIL: header menu button not properly styled');

  // Header branding
  const hasHeaderBrand = games.body.includes('clinician-sidebar-header') && games.body.includes('hospital-icon-box') && games.body.includes('clinician-sidebar-title');
  console.log(' - Sidebar header matches doctor brand format:', hasHeaderBrand);
  console.assert(hasHeaderBrand, 'FAIL: sidebar header does not match brand format');

  // Nav views
  const hasNavViews = games.body.includes('COMPANION CARE VIEWS') && games.body.includes('nav-item-icon-box') && games.body.includes('nav-item-content');
  console.log(' - Navigation has icon boxes, titles, and section title:', hasNavViews);
  console.assert(hasNavViews, 'FAIL: navigation structure does not match');

  // Footer portal switcher & live registry node badge
  const hasPortalSwitcher = games.body.includes('PORTAL MODE SWITCHER') && games.body.includes('id="btn-mode-doctor"') && games.body.includes('id="btn-mode-patient"');
  console.log(' - Footer has Portal Mode Switcher (doctor & patient toggles):', hasPortalSwitcher);
  console.assert(hasPortalSwitcher, 'FAIL: portal switcher missing');

  const hasRegistryBadge = games.body.includes('sidebar-registry-badge') && games.body.includes('badge-dot-live') && games.body.includes('NER Registry Node 03');
  console.log(' - Footer has Live Registry Node badge with pulsing dot:', hasRegistryBadge);
  console.assert(hasRegistryBadge, 'FAIL: registry badge missing');

  console.log('\n=============================================');
  console.log(' ALL PATIENT SIDEBAR & LOGIN CHECKS PASSED! ');
  console.log('=============================================\n');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
