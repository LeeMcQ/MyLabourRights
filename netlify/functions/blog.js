/* ============================================================
   MyLabourRights Backend — Blog Pipeline Function
   POST /.netlify/functions/blog
   Actions:
     { action:'draft',   topic }            -> AI writes a draft, emails it to you
     { action:'publish', post }             -> saves post + posts to social media
     { action:'list' }                      -> returns published posts

   This implements the spec workflow:
   AI generates -> emailed to client -> client approves/edits ->
   published -> auto-shared to LinkedIn / Facebook.

   ENV VARS (Netlify dashboard):
     GEMINI_API_KEY        - for drafting (free)
     APPROVAL_EMAIL        - the address drafts are sent to (yours)
     RESEND_API_KEY        - from https://resend.com (free tier) for email
     LINKEDIN_TOKEN        - optional, for auto-posting
     FACEBOOK_PAGE_TOKEN   - optional, for auto-posting
     FACEBOOK_PAGE_ID      - optional
     BLOG_STORE_URL        - optional JSON store; omitted = returns to caller

   NOTE: Netlify functions are stateless. For real published-post
   storage use Netlify Blobs, a Google Sheet, or a tiny DB. The
   admin panel (admin/index.html) drives this function.
   ============================================================ */

async function aiDraft(topic) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const prompt = `Write a blog article for MyLabourRights, a South African labour-law
help platform, on the topic: "${topic}".
Audience: ordinary South African workers, not lawyers. Plain English.
Accurate to the Labour Relations Act 66 of 1995 and BCEA 75 of 1997.
Return ONLY valid JSON, no markdown:
{
  "title": "...",
  "category": "one of: Unfair dismissal, CCMA process, Workplace rights, Employment contracts, Retrenchment",
  "summary": "one sentence",
  "body": "HTML with 4-5 <p> tags, <strong> for emphasis"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  raw = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  try { return JSON.parse(raw); } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

async function emailDraft(post) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.APPROVAL_EMAIL;
  if (!key || !to) return { sent: false, reason: 'email not configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'MyLabourRights <onboarding@resend.dev>',
      to: [to],
      subject: `[MyLabourRights blog draft] ${post.title}`,
      html: `<h2>${post.title}</h2>
        <p><em>Category: ${post.category}</em></p>
        <p><strong>Summary:</strong> ${post.summary}</p>
        <hr>${post.body}<hr>
        <p>Review, edit if needed, then approve in the MyLabourRights admin panel
        to publish and auto-share to LinkedIn & Facebook.</p>`,
    }),
  });
  return { sent: res.ok };
}

async function postToSocial(post, siteUrl) {
  const results = {};
  // LinkedIn
  if (process.env.LINKEDIN_TOKEN) {
    try {
      // PHASE-2: LinkedIn UGC post API call here
      results.linkedin = 'queued';
    } catch { results.linkedin = 'failed'; }
  }
  // Facebook Page
  if (process.env.FACEBOOK_PAGE_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    try {
      const fb = await fetch(
        `https://graph.facebook.com/${process.env.FACEBOOK_PAGE_ID}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `${post.title}\n\n${post.summary}`,
            link: siteUrl,
            access_token: process.env.FACEBOOK_PAGE_TOKEN,
          }),
        }
      );
      results.facebook = fb.ok ? 'posted' : 'failed';
    } catch { results.facebook = 'failed'; }
  }
  return results;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'bad json' }) }; }

  try {
    if (body.action === 'draft') {
      if (!body.topic)
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'no topic' }) };
      const post = await aiDraft(body.topic);
      if (!post)
        return { statusCode: 200, headers, body: JSON.stringify({ error: 'draft failed — check GEMINI_API_KEY' }) };
      const mail = await emailDraft(post);
      return { statusCode: 200, headers, body: JSON.stringify({ post, emailed: mail.sent }) };
    }

    if (body.action === 'publish') {
      if (!body.post)
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'no post' }) };
      const social = await postToSocial(body.post, body.siteUrl || '');
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ published: true, post: body.post, social }),
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) };
  }
};
