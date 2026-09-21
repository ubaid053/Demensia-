const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');
const lines = app.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('btn-return-doctor') || line.includes('sim-patient-select')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
