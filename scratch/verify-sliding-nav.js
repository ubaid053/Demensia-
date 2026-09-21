const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const gamesHtml = fs.readFileSync('games.html', 'utf8');
const stylesCss = fs.readFileSync('css/styles.css', 'utf8');
const gamesCss = fs.readFileSync('css/games.css', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exit(1);
  }
  console.log('PASS: ' + message);
}

// 1. Check index.html doctor sidebar
assert(indexHtml.includes('id="clinician-sidebar" class="clinician-sidebar sidebar"'), 'index.html has sidebar class');
assert(indexHtml.includes('<ul class="nav" id="doctor-nav-list">'), 'index.html has ul.nav#doctor-nav-list');
assert(indexHtml.includes('<li class="indicator" aria-hidden="true"></li>'), 'index.html has li.indicator');
assert(indexHtml.includes('id="nav-roster"'), 'index.html has nav-roster');
assert(indexHtml.includes('id="nav-caregiver"'), 'index.html has nav-caregiver');
assert(indexHtml.includes('id="nav-analytics"'), 'index.html has nav-analytics');
assert(indexHtml.includes('id="nav-game-analytics"'), 'index.html has nav-game-analytics');
assert(indexHtml.includes('id="nav-patient-app"'), 'index.html has nav-patient-app');

// 2. Check games.html patient sidebar & collapse button
assert(gamesHtml.includes('class="companion-sidebar sidebar"'), 'games.html has sidebar class');
assert(gamesHtml.includes('<ul class="nav" id="patient-nav-list">'), 'games.html has ul.nav#patient-nav-list');
assert(gamesHtml.includes('<li class="indicator" aria-hidden="true"></li>'), 'games.html has li.indicator');
assert(gamesHtml.includes('id="btn-collapse-sidebar"'), 'games.html has btn-collapse-sidebar');
assert(!gamesHtml.includes('x1="18" y1="6" x2="6" y2="18"'), 'games.html X icon removed from collapse button');
assert(gamesHtml.includes('id="nav-btn-dashboard"'), 'games.html has nav-btn-dashboard');
assert(gamesHtml.includes('id="nav-btn-reminders"'), 'games.html has nav-btn-reminders');
assert(gamesHtml.includes('id="nav-btn-activities"'), 'games.html has nav-btn-activities');

// 3. Check css/styles.css
assert(stylesCss.includes('.nav button.active { color: var(--band-text); }'), 'styles.css has active button text rule');
assert(stylesCss.includes('--active-row: 0;'), 'styles.css has --active-row: 0');
assert(stylesCss.includes('translate: 0 var(--indicator-top, calc(var(--active-row) * var(--row)));'), 'styles.css has dynamic indicator translate formula');
assert(stylesCss.includes('cubic-bezier(0.34, 1.16, 0.42, 1)'), 'styles.css has cubic-bezier easing');
assert(stylesCss.includes('.indicator::after'), 'styles.css has .indicator::after notch');
assert(stylesCss.includes('.sidebar.collapsed .label { display: none; }'), 'styles.css has collapsed label rule');

// 4. Check css/games.css
assert(gamesCss.includes('.nav button.active { color: var(--band-text); }'), 'games.css has active button text rule');
assert(gamesCss.includes('--active-row: 0;'), 'games.css has --active-row: 0');
assert(gamesCss.includes('translate: 0 var(--indicator-top, calc(var(--active-row) * var(--row)));'), 'games.css has dynamic indicator translate formula');
assert(gamesCss.includes('cubic-bezier(0.34, 1.16, 0.42, 1)'), 'games.css has cubic-bezier easing');
assert(gamesCss.includes('.indicator::after'), 'games.css has .indicator::after notch');
assert(gamesCss.includes('.sidebar.collapsed .label { display: none; }'), 'games.css has collapsed label rule');

// 5. Check JS dynamic indicator calculation in app.js and games.html
assert(appJs.includes('--indicator-top'), 'app.js sets --indicator-top');
assert(appJs.includes('--indicator-height'), 'app.js sets --indicator-height');
assert(gamesHtml.includes('--indicator-top'), 'games.html sets --indicator-top');
assert(gamesHtml.includes('--indicator-height'), 'games.html sets --indicator-height');

console.log('\n>>> ALL 24 REFINED VALIDATIONS PASSED! <<<');
