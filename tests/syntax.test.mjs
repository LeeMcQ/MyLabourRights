// Fails if any inline <script> in index.html has a syntax error (stress-test blocker 2026-11).
import fs from 'fs';
const h = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const re = /<script(?![^>]*src)([^>]*)>([\s\S]*?)<\/script>/g; let m, n = 0, bad = 0;
while ((m = re.exec(h))) { n++;
  try { if (/ld\+json/.test(m[1])) JSON.parse(m[2]); else new Function(m[2]); }
  catch (e) { bad++; console.error('script', n, e.message); } }
for (const f of ['netlify/functions/ai.js','netlify/functions/pay.js','netlify/functions/pay-notify.js','netlify/functions/blog.js','sw.js']) {
  if (fs.existsSync(new URL('../'+f, import.meta.url))) { /* checked via node --check in npm test */ }
}
if (bad) { console.error(bad, 'broken scripts'); process.exit(1); }
console.log('syntax ok:', n, 'inline scripts');
