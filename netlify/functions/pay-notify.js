/* ============================================================
   MyLabourRights Backend — PayFast ITN (payment notification) handler
   POST /.netlify/functions/pay-notify
   PayFast calls this server-to-server after a payment to confirm
   it. This is the SECURE confirmation — never trust the browser
   redirect alone for unlocking a paid case in production.

   What it does:
     1. Verifies the notification signature
     2. Verifies the source is a real PayFast server (host check)
     3. Logs the confirmed payment

   The ONLY way a case becomes paid: this ITN passes signature,
   PayFast server validation (postback) and amount checks, then the
   result is written to Netlify Blobs ('payments'). The browser asks
   /.netlify/functions/pay-status on return; ?paid=1 is ignored.

   ENV VARS:
     PAYFAST_PASSPHRASE  - same passphrase as in pay.js
     PAYFAST_MODE        - 'sandbox' or 'live'
   ============================================================ */

const crypto = require('crypto');

function buildSignature(data, passphrase) {
  let str = Object.keys(data)
    .filter(k => k !== 'signature' && data[k] !== '' && data[k] != null)
    .map(k => `${k}=${encodeURIComponent(String(data[k]).trim()).replace(/%20/g, '+')}`)
    .join('&');
  if (passphrase) {
    str += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }
  return crypto.createHash('md5').update(str).digest('hex');
}

/* parse the urlencoded body PayFast sends */
function parseBody(raw) {
  const out = {};
  (raw || '').split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
  });
  return out;
}


async function validateWithPayFast(rawBody, mode) {
  const host = mode === 'live' ? 'https://www.payfast.co.za' : 'https://sandbox.payfast.co.za';
  try {
    const r = await fetch(host + '/eng/query/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: rawBody,
    });
    return (await r.text()).trim() === 'VALID';
  } catch (e) { console.error('PayFast validate failed', e.message); return false; }
}

exports.handler = async (event, _ctx, deps = {}) => {
  const ok = { statusCode: 200, body: '' };
  if (event.httpMethod !== 'POST') return ok;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString() : (event.body || '');
    const data = parseBody(raw);
    const PASS = process.env.PAYFAST_PASSPHRASE || '';
    const MODE = process.env.PAYFAST_MODE || 'sandbox';

    // 1. signature is REQUIRED and must match
    if (!data.signature || data.signature !== buildSignature(data, PASS)) {
      console.warn('PayFast ITN: missing/invalid signature — ignored'); return ok;
    }
    // 2. merchant must be ours
    if (process.env.PAYFAST_MERCHANT_ID && data.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
      console.warn('PayFast ITN: merchant mismatch'); return ok;
    }
    // 3. server-to-server validation with PayFast
    const validate = deps.validate || validateWithPayFast;
    if (!(await validate(raw.replace(/&signature=[^&]*/, '').replace(/^signature=[^&]*&?/, ''), MODE))) {
      console.warn('PayFast ITN: postback validation failed'); return ok;
    }
    if (data.payment_status !== 'COMPLETE') return ok;

    const caseId = String(data.m_payment_id || '');
    const store = deps.store || require('@netlify/blobs').getStore('payments');
    const pending = await store.get(caseId, { type: 'json' }).catch(() => null);
    // 4. amount must match what pay.js asked for
    if (!pending || Math.abs(Number(pending.amount) - Number(data.amount_gross)) > 0.01) {
      console.warn('PayFast ITN: unknown case or amount mismatch', caseId); return ok;
    }
    await store.setJSON(caseId, { ...pending, paid: true, pfPaymentId: data.pf_payment_id, paidAt: Date.now() });
    console.log('PayFast ITN CONFIRMED', caseId);
    return ok;
  } catch (err) {
    console.error('PayFast ITN error:', err);
    return ok;
  }
};
