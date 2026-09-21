const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

const sbStart = lines.findIndex(l => l.includes('id="clinician-sidebar"'));
const sbEnd = lines.findIndex(l => l.includes('</aside>'));
console.log('clinician-sidebar start line:', sbStart + 1, 'end line:', sbEnd + 1);

let divCount = 0;
for (let i = sbStart; i <= sbEnd; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(\s|>)/gi) || []).length;
  const closes = (line.match(/<\/div>/gi) || []).length;
  divCount += (opens - closes);
}
console.log('Clinician sidebar div balance:', divCount);
