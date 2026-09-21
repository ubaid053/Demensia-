const fs = require('fs');
const html = fs.readFileSync('landing.html', 'utf8');
const lines = html.split('\n');

const docStart = lines.findIndex(l => l.includes('doctor-login-modal-backdrop'));
const patStart = lines.findIndex(l => l.includes('patient-login-modal-backdrop'));
const patEnd = lines.findIndex(l => l.includes('demo-modal-backdrop'));

console.log('doctor modal start line:', docStart + 1);
console.log('patient modal start line:', patStart + 1);
console.log('demo modal start line:', patEnd + 1);

let divCount = 0;
for (let i = docStart; i < patStart; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(\s|>)/gi) || []).length;
  const closes = (line.match(/<\/div>/gi) || []).length;
  divCount += (opens - closes);
}
console.log('Div depth before patient modal:', divCount);

let patDivCount = 0;
for (let i = patStart; i < patEnd; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(\s|>)/gi) || []).length;
  const closes = (line.match(/<\/div>/gi) || []).length;
  patDivCount += (opens - closes);
}
console.log('Div depth before demo modal:', patDivCount);
