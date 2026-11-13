/* ============================================================
   Daily AI model check  (scheduled — see netlify.toml)

   Every day at 03:17 SAST this function:
     1. pulls each provider's live model list,
     2. picks the newest suitable model (pin in env wins),
     3. sends it a one-word test prompt,
     4. saves the working model to Netlify Blobs ("ai-config"/"models"),
        which ai.js and blog.js read and use automatically,
     5. emails APPROVAL_EMAIL (via Resend) if a model changed or a
        provider has no working model.

   So when Anthropic or Google retire a model, the app moves to the
   replacement within a day — and usually within one request, because
   ai.js also skips retired models on the fly.

   Manual run:  netlify functions:invoke model-check
   ============================================================ */

const Models = require('./_shared/models');

async function notify(subject, html) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.MODEL_ALERT_EMAIL || process.env.APPROVAL_EMAIL;
  if (!key || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MyLabourRights <onboarding@resend.dev>',
        to: [to],
        subject: `[MyLabourRights AI] ${subject}`,
        html,
      }),
    });
    return res.ok;
  } catch { return false; }
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function runCheck() {
  const previous = (await Models.readCheckedConfig()) || {};
  const result = {
    claude: await Models.checkProvider('claude'),
    gemini: await Models.checkProvider('gemini'),
    checkedAt: new Date().toISOString(),
  };

  // Keep the last good model if today's check failed outright, so a
  // provider hiccup doesn't wipe a known-good choice.
  for (const p of ['claude', 'gemini']) {
    if (result[p].configured && !result[p].ok && previous[p] && previous[p].ok) {
      result[p].lastGood = previous[p].model;
    }
  }
  const saved = await Models.writeCheckedConfig(result);

  const changes = [], problems = [];
  for (const p of ['claude', 'gemini']) {
    const now = result[p], before = previous[p] || {};
    if (!now.configured) continue;
    if (!now.ok) problems.push(`${p}: no working model — ${esc(now.error)}`);
    else if (before.model && before.model !== now.model) changes.push(`${p}: ${esc(before.model)} → <strong>${esc(now.model)}</strong>`);
  }

  if (problems.length || changes.length) {
    const rows = ['claude', 'gemini'].map(p => {
      const r = result[p];
      if (!r.configured) return `<li>${p}: no API key set</li>`;
      return `<li>${p}: ${r.ok ? 'OK — ' + esc(r.model) : 'FAILING'}<br><small>tried: ${
        (r.tried || []).map(t => `${esc(t.model)} (${t.status})`).join(', ')}</small></li>`;
    }).join('');
    await notify(
      problems.length ? 'Model check FAILED' : 'Model updated',
      `${problems.length ? `<p><strong>Problems:</strong><br>${problems.join('<br>')}</p>` : ''}
       ${changes.length ? `<p><strong>Changed:</strong><br>${changes.join('<br>')}</p>` : ''}
       <ul>${rows}</ul>
       <p>To pin a model, set CLAUDE_MODEL or GEMINI_MODEL in Netlify environment variables.</p>`);
  }

  if (problems.length) console.error('[model-check]', problems.join(' | '));
  console.log('[model-check]', JSON.stringify({ saved, claude: result.claude.model, gemini: result.gemini.model }));
  return result;
}

exports.handler = async (event) => {
  Models.connectBlobs(event);
  const result = await runCheck();
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) };
};

exports._runCheck = runCheck;
