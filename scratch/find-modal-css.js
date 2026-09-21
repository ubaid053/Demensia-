const fs = require('fs');
const css = fs.readFileSync('css/landing.css', 'utf8');
const lines = css.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('.modal-backdrop') || line.includes('patient-login-modal')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
