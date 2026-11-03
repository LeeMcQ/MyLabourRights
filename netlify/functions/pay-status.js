/* GET /.netlify/functions/pay-status?caseId=...  -> { paid: boolean }
   Read-only view of the server-side payment record written by pay-notify (PayFast ITN). */
exports.handler = async (event, _ctx, deps = {}) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const caseId = ((event.queryStringParameters || {}).caseId || '').slice(0, 80);
  if (!/^[A-Za-z0-9_-]+$/.test(caseId)) return { statusCode: 400, headers, body: '{"error":"caseId"}' };
  try {
    const store = deps.store || require('@netlify/blobs').getStore('payments');
    const rec = await store.get(caseId, { type: 'json' });
    return { statusCode: 200, headers, body: JSON.stringify({ paid: !!(rec && rec.paid), paidAt: rec && rec.paidAt || null }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ paid: false, error: 'store_unavailable' }) };
  }
};
