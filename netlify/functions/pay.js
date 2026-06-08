/* ============================================================
   MyLabourRights Backend — PayFast Payment Function
   POST /.netlify/functions/pay
   Body: { caseId, caseType, amount, returnUrl }
   Returns: { redirectUrl }  -> frontend redirects user to PayFast

   PayFast is South Africa's most common payment gateway and works
   with a free merchant account. This builds the signed redirect URL.

   ENV VARS (Netlify dashboard):
     PAYFAST_MERCHANT_ID   - from your PayFast account
     PAYFAST_MERCHANT_KEY  - from your PayFast account
     PAYFAST_PASSPHRASE    - set in PayFast settings (recommended)
     PAYFAST_MODE          - 'sandbox' for testing, 'live' for real
   ============================================================ */

const crypto = require('crypto');

function buildSignature(data, passphrase) {
  // PayFast: URL-encode, sort is NOT applied — use insertion order
  let str = Object.keys(data)
    .filter(k => data[k] !== '' && data[k] != null)
    .map(k => `${k}=${encodeURIComponent(String(data[k]).trim()).replace(/%20/g, '+')}`)
    .join('&');
  if (passphrase) {
    str += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }
  return crypto.createHash('md5').update(str).digest('hex');
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

  const MID = process.env.PAYFAST_MERCHANT_ID;
  const MKEY = process.env.PAYFAST_MERCHANT_KEY;
  const PASS = process.env.PAYFAST_PASSPHRASE || '';
  const MODE = process.env.PAYFAST_MODE || 'sandbox';

  if (!MID || !MKEY) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ fallback: true, message: 'PayFast not configured — payment is simulated.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'bad json' }) }; }

  const { caseId, caseType, amount, returnUrl } = body;
  if (!caseId || !amount)
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing fields' }) };

  const host = MODE === 'live'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';

  const itemNames = {
    personal: 'MyLabourRights — Personal CCMA Case (6 months)',
    grievance: 'MyLabourRights — Company Grievance Case (6 months)',
    offtopic: 'MyLabourRights — Additional Case (6 months)',
  };

  const data = {
    merchant_id: MID,
    merchant_key: MKEY,
    return_url: returnUrl || 'https://your-site.netlify.app/?paid=1',
    cancel_url: returnUrl || 'https://your-site.netlify.app/?paid=0',
    notify_url: 'https://your-site.netlify.app/.netlify/functions/pay-notify',
    m_payment_id: caseId,
    amount: Number(amount).toFixed(2),
    item_name: itemNames[caseType] || 'MyLabourRights Case',
    custom_str1: caseType || '',
  };
  data.signature = buildSignature(data, PASS);

  const query = Object.keys(data)
    .map(k => `${k}=${encodeURIComponent(data[k])}`)
    .join('&');

  return {
    statusCode: 200, headers,
    body: JSON.stringify({ redirectUrl: `${host}?${query}` }),
  };
};
