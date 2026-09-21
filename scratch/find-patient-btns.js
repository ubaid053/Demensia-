const fs = require('fs');
const html = fs.readFileSync('landing.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, i) => {
  if (l.includes('btn-patient-login-trigger')) {
    console.log(`Line ${i+1}: ${l}`);
  }
  if (l.includes('Patient App')) {
    console.log(`Patient App at Line ${i+1}: ${l}`);
  }
});
