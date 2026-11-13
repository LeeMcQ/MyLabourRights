/* ============================================================
   Shared AI model resolver + callers
   Used by ai.js, blog.js and the daily model-check function.

   WHY: hard-coded model IDs (gemini-1.5-flash, claude-3-5-haiku-20241022)
   were retired by the providers and every AI call silently fell back to
   the offline simulation. Models are now picked in this order, per call:

     1. Pinned in Netlify env       CLAUDE_MODEL / GEMINI_MODEL
     2. Verified by the daily check  (Netlify Blobs store "ai-config")
     3. Auto-resolved from the provider's live model list (cached 24 h)
     4. Built-in fallback list

   A model that answers "not found / retired" is skipped for the life of
   the function instance and the next candidate is tried, so a retirement
   never takes the AI offline again.

   Env:
     CLAUDE_API_KEY (or ANTHROPIC_API_KEY), GEMINI_API_KEY
     CLAUDE_MODEL, GEMINI_MODEL          optional pins
     CLAUDE_MODEL_FAMILY                 'haiku' (default) | 'sonnet' | 'opus'
   ============================================================ */

const ANTHROPIC_VERSION = '2023-06-01';
const DAY_MS = 24 * 60 * 60 * 1000;
const CONFIG_TTL_MS = 10 * 60 * 1000;   // re-read the daily-check result every 10 min

/* Last-resort lists, newest first. Update when convenient — the
   resolver normally finds newer models without a code change. */
const FALLBACKS = {
  claude: {
    haiku:  ['claude-haiku-5-5', 'claude-haiku-4-5'],
    sonnet: ['claude-sonnet-5-5', 'claude-sonnet-4-6'],
    opus:   ['claude-opus-5-5', 'claude-opus-4-8'],
  },
  // gemini-flash-latest is Google's self-updating alias for the newest Flash.
  gemini: ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'],
};

const claudeKey = () => process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const geminiKey = () => process.env.GEMINI_API_KEY || '';
const claudeFamily = () => (process.env.CLAUDE_MODEL_FAMILY || 'haiku').toLowerCase();

/* ---------- per-instance state ---------- */
const dead = new Set();                     // "provider:model" that returned not-found
let cfgCache = { at: 0, value: null };      // daily-check result
const listCache = { claude: { at: 0, ids: [] }, gemini: { at: 0, ids: [] } };

/* Lambda-style handlers (exports.handler) must hand the event to Blobs
   before getStore() works (@netlify/blobs v7+). Safe to call every time. */
function connectBlobs(event) {
  try {
    const { connectLambda } = require('@netlify/blobs');
    if (event && event.blobs && typeof connectLambda === 'function') connectLambda(event);
  } catch { /* local dev / older runtime */ }
}

function store() {
  try {
    const { getStore } = require('@netlify/blobs');
    return getStore('ai-config');
  } catch { return null; }
}

async function readCheckedConfig() {
  if (Date.now() - cfgCache.at < CONFIG_TTL_MS) return cfgCache.value;
  let value = null;
  const s = store();
  if (s) { try { value = await s.get('models', { type: 'json' }); } catch { value = null; } }
  cfgCache = { at: Date.now(), value };
  return value;
}

async function writeCheckedConfig(value) {
  const s = store();
  if (!s) return false;
  try { await s.setJSON('models', value); cfgCache = { at: Date.now(), value }; return true; }
  catch { return false; }
}

/* ---------- live model lists ---------- */
async function listClaudeModels() {
  const key = claudeKey();
  if (!key) return [];
  const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
    headers: { 'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION },
  });
  if (!res.ok) return [];
  const data = await res.json();
  // API returns newest first; keep that order but sort defensively.
  return (data.data || [])
    .slice()
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map(m => m.id);
}

async function listGeminiModels() {
  const key = geminiKey();
  if (!key) return [];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${key}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => String(m.name || '').replace(/^models\//, ''));
}

/* Newest stable model in the chosen Claude family, e.g. claude-haiku-5-5 */
function pickClaude(ids, family) {
  return ids.find(id => id.startsWith('claude-') && id.includes(family)) || null;
}

/* Highest stable "gemini-X.Y-flash" (no lite / preview / exp / tts / image) */
function pickGemini(ids) {
  const stable = ids
    .map(id => ({ id, m: id.match(/^gemini-(\d+(?:\.\d+)?)-flash$/) }))
    .filter(x => x.m)
    .sort((a, b) => parseFloat(b.m[1]) - parseFloat(a.m[1]));
  return stable.length ? stable[0].id : null;
}

async function autoResolve(provider) {
  const c = listCache[provider];
  if (Date.now() - c.at < DAY_MS && c.ids.length) return c.ids;
  let ids = [];
  try { ids = provider === 'claude' ? await listClaudeModels() : await listGeminiModels(); }
  catch { ids = []; }
  listCache[provider] = { at: Date.now(), ids };
  return ids;
}

/* Ordered, de-duplicated candidate list for a provider */
async function candidates(provider, { skipChecked = false } = {}) {
  const out = [];
  const add = id => { if (id && !out.includes(id) && !dead.has(provider + ':' + id)) out.push(id); };

  add(provider === 'claude' ? process.env.CLAUDE_MODEL : process.env.GEMINI_MODEL);

  if (!skipChecked) {
    const cfg = await readCheckedConfig();
    if (cfg && cfg[provider] && cfg[provider].ok) add(cfg[provider].model);
  }

  if (provider === 'gemini') add('gemini-flash-latest');
  const ids = await autoResolve(provider);
  add(provider === 'claude' ? pickClaude(ids, claudeFamily()) : pickGemini(ids));

  const fb = provider === 'claude'
    ? (FALLBACKS.claude[claudeFamily()] || FALLBACKS.claude.haiku)
    : FALLBACKS.gemini;
  fb.forEach(add);
  return out;
}

/* A response that means "this model ID no longer exists" — try the next one */
function isModelGone(status, bodyText) {
  if (status === 404) return true;
  if (status === 400 && /model|not[ _]found|deprecat|retired|no longer/i.test(bodyText)) return true;
  return false;
}

/* ---------- raw calls (one model) ---------- */
async function rawClaude(model, system, messages, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey(),
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({ model, max_tokens: maxTokens || 1024, system, messages }),
  });
  const bodyText = await res.text();
  if (!res.ok) return { ok: false, status: res.status, bodyText };
  let data = null; try { data = JSON.parse(bodyText); } catch {}
  const text = (data && Array.isArray(data.content))
    ? data.content.filter(p => p.type === 'text').map(p => p.text).join('')
    : '';
  return { ok: !!text, status: res.status, text, bodyText };
}

async function rawGemini(model, system, contents, maxTokens, json) {
  const generationConfig = { temperature: 0.5, maxOutputTokens: maxTokens || 2048 };
  if (json) generationConfig.responseMimeType = 'application/json';
  const body = { contents, generationConfig };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${geminiKey()}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const bodyText = await res.text();
  if (!res.ok) return { ok: false, status: res.status, bodyText };
  let data = null; try { data = JSON.parse(bodyText); } catch {}
  // newer Gemini models may return several parts (incl. thought parts) — join the text ones
  const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content
    && data.candidates[0].content.parts) || [];
  const text = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text).join('');
  return { ok: !!text, status: res.status, text, bodyText };
}

/* ---------- public: call with automatic model fallback ---------- */
async function callWithFallback(provider, doCall) {
  const list = await candidates(provider);
  for (const model of list) {
    let r;
    try { r = await doCall(model); } catch (e) { r = { ok: false, status: 0, bodyText: String(e) }; }
    if (r.ok) return { text: r.text, model };
    if (isModelGone(r.status, r.bodyText || '')) {
      dead.add(provider + ':' + model);
      console.warn(`[models] ${provider} model "${model}" unavailable (${r.status}) — trying next`);
      continue;
    }
    // auth, rate limit, overload, safety block: another model won't help
    console.warn(`[models] ${provider} "${model}" failed (${r.status}): ${(r.bodyText || '').slice(0, 200)}`);
    return null;
  }
  console.error(`[models] no working ${provider} model. Tried: ${list.join(', ') || '(none)'}`);
  return null;
}

/* history: [{role:'ai'|'me'|'user', text}] ; userContent: final user turn text */
async function callClaude(system, history, userContent, maxTokens) {
  if (!claudeKey()) return null;
  const messages = history.map(h => ({ role: h.role === 'ai' ? 'assistant' : 'user', content: h.text }));
  messages.push({ role: 'user', content: userContent });
  return callWithFallback('claude', m => rawClaude(m, system, messages, maxTokens));
}

async function callGemini(system, history, userContent, maxTokens, opts = {}) {
  if (!geminiKey()) return null;
  const contents = history.map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] }));
  contents.push({ role: 'user', parts: [{ text: userContent }] });
  return callWithFallback('gemini', m => rawGemini(m, system, contents, maxTokens, opts.json !== false));
}

/* ---------- daily health check: verify a working model per provider ---------- */
async function checkProvider(provider) {
  if (provider === 'claude' && !claudeKey()) return { configured: false };
  if (provider === 'gemini' && !geminiKey()) return { configured: false };
  listCache[provider] = { at: 0, ids: [] };           // force a fresh list
  const tried = [];
  for (const model of await candidates(provider, { skipChecked: true })) {
    const r = provider === 'claude'
      ? await rawClaude(model, 'Reply with the single word OK.', [{ role: 'user', content: 'ping' }], 16)
      : await rawGemini(model, 'Reply with the single word OK.', [{ role: 'user', parts: [{ text: 'ping' }] }], 64, false);
    tried.push({ model, status: r.status, ok: r.ok });
    if (r.ok) return { configured: true, ok: true, model, tried, checkedAt: new Date().toISOString() };
    if (!isModelGone(r.status, r.bodyText || '')) {
      return { configured: true, ok: false, model: null, tried, error: (r.bodyText || '').slice(0, 300),
               checkedAt: new Date().toISOString() };
    }
  }
  return { configured: true, ok: false, model: null, tried, error: 'no candidate model answered',
           checkedAt: new Date().toISOString() };
}

module.exports = {
  connectBlobs, callClaude, callGemini, callWithFallback,
  checkProvider, readCheckedConfig, writeCheckedConfig,
  candidates, pickClaude, pickGemini, isModelGone,
  claudeKey, geminiKey, FALLBACKS,
  _reset() { dead.clear(); cfgCache = { at: 0, value: null };
             listCache.claude = { at: 0, ids: [] }; listCache.gemini = { at: 0, ids: [] }; },
};
