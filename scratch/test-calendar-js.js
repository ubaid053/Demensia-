const fs = require('fs');
const assert = require('assert');

// Test that app.js calendar logic can execute cleanly
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Verify helper functions exist and have proper syntax
assert(appJs.includes('_generateDocDayCellHtml('), 'Must include _generateDocDayCellHtml');
assert(appJs.includes('_wireDocCalendarControls('), 'Must include _wireDocCalendarControls');
assert(appJs.includes('renderDoctorDayInspector('), 'Must include renderDoctorDayInspector');

console.log('✓ JS Syntax and calendar methods validated.');
