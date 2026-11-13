// Model resolver + live AI call path. Mocks fetch — no real API calls.
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(import.meta.url);

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  ✅ ', name); } else { fail++; console.log('  ❌ ', name); } };

const RETIRED = new Set(['claude-3-5-haiku-20241022', 'gemini-1.5-flash', 'claude-haiku-5-5', 'gemini-flash-latest']);
const calls = [];
function mockFetch({ claudeModels = [], geminiModels = [], reply = '{"text":"Your 30-day window closes on 31 Oct.","followUp":"What date were you told?","evidence":[],"successRate":null,"validity":null}' } = {}) {
  global.fetch = async (url, init = {}) => {
    const u = String(url);
    const body = init.body ? JSON.parse(init.body) : null;
    const resp = (status, obj) => ({ ok: status < 300, status, text: async () => JSON.stringify(obj), json: async () => obj });
    if (u.startsWith('https://api.anthropic.com/v1/models')) return resp(200, { data: claudeModels.map((id, i) => ({ id, created_at: `2026-0${9 - i}-01T00:00:00Z` })) });
    if (u.startsWith('https://generativelanguage.googleapis.com/v1beta/models?')) return resp(200, { models: geminiModels.map(n => ({ name: 'models/' + n, supportedGenerationMethods: ['generateContent'] })) });
    if (u.startsWith('https://api.anthropic.com/v1/messages')) {
      calls.push('claude:' + body.model);
      if (RETIRED.has(body.model)) return resp(404, { type: 'error', error: { type: 'not_found_error', message: `model: ${body.model}` } });
      return resp(200, { content: [{ type: 'text', text: reply }] });
    }
    const gm = u.match(/models\/([^:]+):generateContent/);
    if (gm) {
      const model = decodeURIComponent(gm[1]);
      calls.push('gemini:' + model);
      if (RETIRED.has(model)) return resp(404, { error: { code: 404, message: `models/${model} is not found` } });
      return resp(200, { candidates: [{ content: { parts: [{ text: reply }] } }] });
    }
    return resp(404, {});
  };
}

const M = require('../netlify/functions/_shared/models.js');

console.log('\nPickers');
ok(M.pickGemini(['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.6-flash-lite', 'gemini-3.8-flash-preview']) === 'gemini-3.6-flash', 'pickGemini → highest stable Flash, ignores lite/preview');
ok(M.pickClaude(['claude-opus-5-5', 'claude-haiku-5-6', 'claude-haiku-5-5'], 'haiku') === 'claude-haiku-5-6', 'pickClaude → newest in family (list order)');
ok(M.isModelGone(404, '') && M.isModelGone(400, 'model not found') && !M.isModelGone(429, 'rate'), 'isModelGone: 404/400-model yes, 429 no');

console.log('\nRetired-model fallback');
process.env.CLAUDE_API_KEY = 'test'; process.env.GEMINI_API_KEY = 'test';
process.env.CLAUDE_MODEL = 'claude-3-5-haiku-20241022';           // a stale pin
delete process.env.GEMINI_MODEL;
M._reset(); calls.length = 0;
mockFetch({ claudeModels: ['claude-haiku-5-6', 'claude-sonnet-5-5'], geminiModels: ['gemini-3.6-flash', 'gemini-2.5-flash'] });
const rc = await M.callClaude('sys', [], 'hi', 50);
ok(rc && rc.model === 'claude-haiku-5-6', 'stale Claude pin 404s → newest live Haiku used (' + (rc && rc.model) + ')');
const rg = await M.callGemini('sys', [], 'hi', 50);
ok(rg && rg.model === 'gemini-3.6-flash', 'gemini-flash-latest 404s → newest stable Flash used (' + (rg && rg.model) + ')');
calls.length = 0;
await M.callClaude('sys', [], 'hi', 50);
ok(calls[0] === 'claude:claude-haiku-5-6', 'retired model is not retried on the next call');

console.log('\nNon-model errors do not loop through every model');
M._reset(); calls.length = 0;
global.fetch = async (u) => ({ ok: false, status: String(u).includes('/v1/models') ? 200 : 429, text: async () => '{"data":[]}', json: async () => ({ data: [] }) });
const r429 = await M.callClaude('sys', [], 'hi', 50);
ok(r429 === null, '429 rate limit → stops after first model');

console.log('\nai.js end-to-end (live path, not simulation)');
delete process.env.CLAUDE_MODEL;
M._reset(); calls.length = 0;
mockFetch({ claudeModels: ['claude-haiku-5-6'], geminiModels: ['gemini-3.6-flash'] });
const { handler } = require('../netlify/functions/ai.js');
const r = await handler({ httpMethod: 'POST', headers: { origin: 'https://mylabourrights.co.za', 'x-nf-client-connection-ip': '9.9.9.9' },
  body: JSON.stringify({ userText: 'I was dismissed on 1 October without a hearing, do I have a case at the CCMA?', persona: 'FORMAT…',
    caseContext: { disputeKey: 'unfair_dismissal', deadlineStatus: 'missed', daysToDeadline: -13, docCount: 1, strength: 40 } }) });
const out = JSON.parse(r.body);
ok(!out.fallback && out.text && out.model, 'ai.js returns a real model answer (' + out.provider + ' / ' + out.model + ')');
ok(r.headers['Access-Control-Allow-Origin'] === 'https://mylabourrights.co.za', 'CORS allows the real mylabourrights.co.za domain');

console.log('\nClient wiring');
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
ok(!/CaseEngine\.persona\(c\)/.test(html) && /CaseEngine\.persona\(caseObj\)/.test(html), 'Backend.ai passes caseObj to persona() (no ReferenceError)');
const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
ok(/\[functions\."model-check"\][\s\S]*schedule\s*=/.test(toml), 'model-check is scheduled in netlify.toml');
for (const f of ['ai.js', 'blog.js']) {
  const src = readFileSync(new URL('../netlify/functions/' + f, import.meta.url), 'utf8');
  ok(!/gemini-1\.5|claude-3-5-haiku/.test(src), f + ' has no hard-coded retired model IDs');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
