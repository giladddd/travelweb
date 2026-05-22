const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
// Find the occurrence with wp-content
let idx = 0;
let count = 0;
while (true) {
  const pos = html.indexOf('the-smart-traveller.com', idx);
  if (pos === -1) break;
  count++;
  const after = html.substring(pos + 23, pos + 50);
  if (after.includes('wp') || after.includes('upload')) {
    console.log('Found at', pos, ':', JSON.stringify(html.substring(pos, pos + 150)));
  }
  idx = pos + 1;
  if (count > 200) break;
}
console.log('Total occurrences searched:', count);
