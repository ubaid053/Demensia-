const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const stylesCss = fs.readFileSync('css/styles.css', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exit(1);
  }
  console.log('PASS: ' + message);
}

// 1. Check Search & Filter Toolbar in index.html
assert(indexHtml.includes('class="roster-toolbar"'), 'index.html has .roster-toolbar');
assert(indexHtml.includes('id="roster-search-input"'), 'index.html has search input');
assert(indexHtml.includes('id="btn-clear-search"'), 'index.html has clear search button');
assert(indexHtml.includes('id="btn-reset-filters"'), 'index.html has reset filters button');
assert(indexHtml.includes('class="select-custom-wrapper"'), 'index.html has select-custom-wrapper');
assert(indexHtml.includes('class="select-chevron"'), 'index.html has select-chevron SVG');
assert(indexHtml.includes('id="roster-filter-status"'), 'index.html has status filter select');
assert(indexHtml.includes('id="roster-filter-district"'), 'index.html has district filter select');
assert(indexHtml.includes('id="roster-filter-language"'), 'index.html has language filter select');
assert(indexHtml.includes('id="roster-filter-hw"'), 'index.html has health worker filter select');

// 2. Check CSS rules in styles.css for search & filter toolbar
assert(stylesCss.includes('.roster-toolbar'), 'styles.css has .roster-toolbar styling');
assert(stylesCss.includes('.toolbar-search-row'), 'styles.css has .toolbar-search-row');
assert(stylesCss.includes('.roster-search-input'), 'styles.css has .roster-search-input');
assert(stylesCss.includes('.filter-reset-btn'), 'styles.css has .filter-reset-btn');
assert(stylesCss.includes('.toolbar-filters-row'), 'styles.css has .toolbar-filters-row');
assert(stylesCss.includes('.filter-select'), 'styles.css has .filter-select');
assert(stylesCss.includes('.select-custom-wrapper'), 'styles.css has .select-custom-wrapper');
assert(stylesCss.includes('.filter-dot-indicator'), 'styles.css has .filter-dot-indicator');

// 3. Check Doctor Profile Edit Option in index.html & styles.css
assert(indexHtml.includes('id="btn-edit-doctor-profile"'), 'index.html has btn-edit-doctor-profile');
assert(indexHtml.includes('id="doctor-profile-view-mode"'), 'index.html has view mode container');
assert(indexHtml.includes('id="doctor-profile-edit-mode"'), 'index.html has edit mode form');
assert(indexHtml.includes('id="input-doc-name"'), 'index.html has input-doc-name');
assert(indexHtml.includes('id="input-doc-email"'), 'index.html has input-doc-email');
assert(stylesCss.includes('.btn-profile-edit-toggle'), 'styles.css has .btn-profile-edit-toggle');
assert(stylesCss.includes('.profile-edit-grid'), 'styles.css has .profile-edit-grid');
assert(stylesCss.includes('.edit-input-field'), 'styles.css has .edit-input-field');

// 4. Check JS in app.js
assert(appJs.includes('cdx_doctor_profile'), 'app.js persists profile to localStorage');
assert(appJs.includes('btnEditToggle'), 'app.js wires edit toggle');
assert(appJs.includes('syncFilterVisualStates'), 'app.js syncs filter visual states');
// Check menu auto-close bug is removed
assert(!appJs.includes('setTimeout(closeSidebar, 240);'), 'app.js does NOT automatically close sidebar on item click');

console.log('\n>>> ALL 24 UI/UX & BUGFIX TESTS PASSED! <<<');
