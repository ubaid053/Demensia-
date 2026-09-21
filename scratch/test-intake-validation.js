const fs = require('fs');

// Create mock DOM for intake testing
const elements = {};
function mockElement(id, tag = 'div', type = '') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    checked: false,
    textContent: '',
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); }
    },
    scrollIntoView: () => {},
    focus: () => {},
    closest: function(sel) { return this.parent || null; }
  };
  elements[id] = el;
  return el;
}

[
  'intake-mode', 'intake-record-id', 'intake-form-heading', 'intake-form-subheading',
  'intake-submit-top-text', 'intake-submit-bottom-text', 'intake-uhid', 'intake-name',
  'intake-age', 'intake-gender', 'intake-district', 'intake-village', 'intake-language',
  'intake-sec-language', 'intake-baseline-stage', 'chk-phys-none', 'intake-doctor',
  'intake-hw', 'intake-cg-name', 'intake-cg-rel', 'intake-cg-phone', 'intake-sec-cg-name',
  'intake-sec-cg-phone', 'intake-device-type', 'intake-connectivity', 'intake-med-morning',
  'intake-med-evening', 'intake-hydration-freq', 'intake-consent-check', 'intake-consent-date',
  'intake-consent-by', 'intake-draft-text', 'group-patient-name', 'group-patient-age',
  'group-patient-district', 'group-patient-language', 'group-cg-name', 'group-cg-phone',
  'group-consent-check'
].forEach(id => mockElement(id));

global.document = {
  getElementById: (id) => elements[id] || null,
  addEventListener: () => {},
  querySelectorAll: (sel) => {
    if (sel === 'input[name="phys-considerations"]') return [];
    if (sel.includes('.form-field-group')) return Object.values(elements).filter(e => e.id.startsWith('group-'));
    if (sel.includes('.form-input')) return Object.values(elements).filter(e => e.id.startsWith('intake-'));
    return [];
  }
};

global.window = {
  scrollTo: () => {}
};

// Load app.js functions into mock App context
const appCode = fs.readFileSync('js/app.js', 'utf8');

// Extract App methods
const vm = require('vm');
const sandbox = {
  document: global.document,
  window: global.window,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Date: Date,
  Math: Math,
  parseInt: parseInt,
  isNaN: isNaN,
  Set: Set,
  toastLog: [],
  App: {
    data: { patients: [] },
    showToast: function(msg) { this.toastLog.push(msg); },
    navigateTo: function(view, id) { this.lastNav = { view, id }; },
    toastLog: []
  }
};

vm.runInNewContext(`
${appCode};
globalThis.App = ClinicalApp;
`, sandbox);

const App = sandbox.App;

// Test 1: openNewIntake sets defaults
App.openNewIntake();
console.log('Test 1 - openNewIntake defaults:');
console.log('District:', elements['intake-district'].value);
console.log('Language:', elements['intake-language'].value);
console.log('Consent:', elements['intake-consent-check'].checked);
if (elements['intake-district'].value !== 'Kamrup Metro (Assam)') throw new Error('District default failed');
if (elements['intake-language'].value !== 'Assamese') throw new Error('Language default failed');
if (elements['intake-consent-check'].checked !== true) throw new Error('Consent check default failed');

// Test 2: validation with just Name and Age filled in
elements['intake-name'].value = 'Tarun Gogoi';
elements['intake-age'].value = '72';
const valid1 = App.validateIntakeForm();
console.log('\nTest 2 - Validate with Name and Age:', valid1);
console.log('Caregiver name auto-fallback:', elements['intake-cg-name'].value);
console.log('Caregiver phone auto-fallback:', elements['intake-cg-phone'].value);
if (!valid1) throw new Error('Expected validation to pass with auto-fallbacks');
if (!elements['intake-cg-name'].value.includes('Tarun')) throw new Error('Caregiver fallback failed');

// Test 3: submission
App.data = { patients: [] };
App.navigateTo = function(view, id) { this.lastNav = { view, id }; };
App.showToast = function(msg) { this.toastLog.push(msg); };
App.toastLog = [];
App.submitIntakeForm();
console.log('\nTest 3 - Submit result:');
console.log('Patients count:', App.data.patients.length);
console.log('Latest patient:', App.data.patients[0]?.name);
console.log('Last toast:', App.toastLog[App.toastLog.length - 1]);
if (App.data.patients.length !== 1) throw new Error('Patient not added to registry');
if (App.data.patients[0].name !== 'Tarun Gogoi') throw new Error('Patient name mismatch');

// Test 4: Young-onset patient age 35
App.openNewIntake();
elements['intake-name'].value = 'Geeta Saikia';
elements['intake-age'].value = '35';
const valid2 = App.validateIntakeForm();
console.log('\nTest 4 - Validate age 35 patient:', valid2);
if (!valid2) throw new Error('Age 35 should be accepted');

// Test 5: Missing name gives informative toast, not generic error
App.openNewIntake();
elements['intake-name'].value = '';
elements['intake-age'].value = '65';
App.submitIntakeForm();
const lastToast = App.toastLog[App.toastLog.length - 1];
console.log('\nTest 5 - Missing name toast:', lastToast);
if (!lastToast.includes('Patient Full Name')) throw new Error('Toast did not mention Patient Full Name');

console.log('\n>>> ALL INTAKE FORM TESTS PASSED! <<<');
