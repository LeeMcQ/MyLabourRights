// MyLabourRights — netlify/functions/blog.js
// Panel 1 Finding C fix:
//   Blog generator must NOT emit specific deadlines or monetary thresholds.
//   Specific legal figures go stale between deploys. The in-app calculator
//   is the authoritative source — blog posts redirect readers there.

'use strict';

// POPIA logging contract: never log request body content.

async function aiDraft(topic) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt = `Write a blog article for MyLabourRights, a South African labour-law
help platform, on the topic: "${topic}".

Audience: ordinary South African workers, not lawyers. Plain English.
Accurate to the Labour Relations Act 66 of 1995 and BCEA 75 of 1997.

CRITICAL RULES — violating these will cause real harm to workers:
1. Do NOT state specific deadlines in days (e.g. do not write "30 days" or "90 days").
   Instead write: "strict time limits apply — use the deadline calculator in the app
   to check your specific deadline before taking any action."
2. Do NOT state specific monetary thresholds, wages, or earnings figures
   (e.g. do not write "R269,900" or "R30.23 per hour").
   Instead write: "earnings thresholds and minimum wages are updated regularly —
   verify current figures using the legal facts checker in the app or at labour.gov.za."
3. Do NOT state compensation caps as specific amounts or months (e.g. do not write
   "up to 12 months"). Instead write: "compensation limits apply — the app will
   calculate the relevant cap for your dispute type."
4. Every article MUST end with this exact call-to-action paragraph:
   "Time limits in labour law are strict and the figures change regularly.
   Before you take any action, use the MyLabourRights deadline calculator and
   legal facts checker to confirm the current rules that apply to your situation."

Return ONLY valid JSON, no markdown:
{
  "title": "...",
  "category": "one of: Unfair dismissal, CCMA process, Workplace rights, Employment contracts, Retrenchment",
  "summary": "one sentence",
  "body": "HTML with 4-5 <p> tags, <strong> for emphasis. Must include the required call-to-action as the final <p>."
}`;

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
      }),
    }
  );
  if (!res.ok) {
    console.error('[blog.js] Gemini error:', res.status);
    return null;
  }
  const data = await res.json();
  let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  raw = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  try { return JSON.parse(raw); } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

// Post-generation safety check: strip any stale figures the model snuck in
// despite instructions. This is a defence-in-depth measure.
function sanitiseBlogBody(body) {
  if (!body) return body;
  // Flag patterns that indicate specific figures were included against instructions
  const flagged = [
    /\b\d+\s*days?\b/gi,           // "30 days", "90 days"
    /\bR\s*[\d,]+(\.\d+)?\b/gi,    // "R30.23", "R269,900"
    /\b\d+\s*months?\s*(pay|remuneration|compensation)\b/gi, // "12 months pay"
  ];
  let sanitised = body;
  for (const re of flagged) {
    sanitised = sanitised.replace(re, (match) => {
      // Replace with a safe redirect phrase
      return `[use the in-app calculator to confirm current figures]`;
    });
  }
  return sanitised;
}

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { topic, action } = body;

  if (action === 'draft') {
    if (!topic || typeof topic !== 'string') {
      return new Response(JSON.stringify({ error: 'topic required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    // POPIA: log topic category only (topic string is not personal data,
    // but we keep it out of logs as a general privacy practice)
    console.log('[blog.js] Draft requested');
    const article = await aiDraft(topic.slice(0, 200));
    if (!article) {
      return new Response(JSON.stringify({ error: 'Generation failed' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
    // Apply safety sanitiser
    article.body = sanitiseBlogBody(article.body);
    article._sanitised = true; // flag for admin UI to show a review reminder
    return new Response(JSON.stringify({ ok: true, article }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  });
};
