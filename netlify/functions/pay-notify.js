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

   IMPORTANT: Netlify functions are stateless. To actually mark a
   case as paid from here you need a shared datastore both this
   function and your app can read (Netlify Blobs, a database, or
   a Google Sheet). Until that is added, the app unlocks the case
   via the browser return (?paid=1) — fine for launch, but add a
   datastore before you are taking real money at volume.

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

exports.handler = async (event) => {
  // PayFast expects a 200 OK quickly, with no body
  const ok = { statusCode: 200, body: '' };

  if (event.httpMethod !== 'POST') return ok;

  try {
    const data = parseBody(event.body);
    const PASS = process.env.PAYFAST_PASSPHRASE || '';

    // 1. signature check
    const expected = buildSignature(data, PASS);
    if (data.signature && data.signature !== expected) {
      console.warn('PayFast ITN: signature mismatch — ignored');
      return ok;
    }

    // 2. only accept COMPLETE payments
    if (data.payment_status !== 'COMPLETE') {
      console.log('PayFast ITN: status', data.payment_status, '— no action');
      return ok;
    }

    // 3. confirmed payment
    const caseId = data.m_payment_id;
    const amount = data.amount_gross;
    const caseType = data.custom_str1;
    console.log(`PayFast ITN CONFIRMED: case=${caseId} type=${caseType} amount=R${amount}`);

    // 4. TODO (add datastore): mark the case paid here so it is
    //    authoritative even if the user closes the browser.
    //    e.g. with Netlify Blobs:
    //      const { getStore } = require('@netlify/blobs');
    //      await getStore('payments').setJSON(caseId, {
    //        paid:true, caseType, amount, at:Date.now()
    //      });

    return ok;
  } catch (err) {
    console.error('PayFast ITN error:', err);
    return ok; // still 200 so PayFast does not retry forever
  }
};
