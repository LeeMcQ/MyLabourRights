// ai.js must not 429 the first request (missing await regression, 2026-11).
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
delete process.env.ANTHROPIC_API_KEY; delete process.env.GEMINI_API_KEY;
const { handler } = require('../netlify/functions/ai.js');
const r = await handler({ httpMethod:'POST', headers:{ origin:'', 'x-nf-client-connection-ip':'1.2.3.4' }, body: JSON.stringify({ userText:'I was dismissed' }) });
if (r.statusCode === 429) { console.error('FAIL first request 429'); process.exit(1); }
console.log('ai.js first request status', r.statusCode, '(not 429) ok');
