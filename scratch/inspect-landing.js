const fs = require('fs');
const text = fs.readFileSync('landing.html', 'utf8');
const lines = text.split(/\r?\n/);
lines.forEach((l, i) => {
  if (l.includes('<section') || l.includes('class="section-') || l.includes('id="section-')) {
    console.log(i + 1, l.trim());
  }
});
