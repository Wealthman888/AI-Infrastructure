const { getVerifiedCustomerId } = require('../lib/verifyProxy');

const APPSTLE_BASE = 'https://subscription-admin.appstle.com/api/external/v2';

// Returns the signed-in customer's current active subscription (contract id +
// its most recent order's line items) so the storefront can pre-populate
// "My Box" before the customer makes any changes. Read-only — never mutates.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const customerId = getVerifiedCustomerId(req);
  if (!customerId) {
    res.status(401).json({ error: 'Not signed in, or request did not come through the storefront app proxy' });
    return;
  }

  const apiKey = process.env.APPSTLE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfigured: APPSTLE_API_KEY is not set' });
    return;
  }

  try {
    const lookupResp = await fetch(`${APPSTLE_BASE}/subscription-customers/valid/${customerId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    if (!lookupResp.ok) {
      const detail = await lookupResp.text();
      res.status(lookupResp.status).json({ error: 'Could not look up subscription', detail });
      return;
    }
    const contractIds = await lookupResp.json();
    if (!Array.isArray(contractIds) || contractIds.length === 0) {
      res.status(200).json({ hasSubscription: false });
      return;
    }
    const contractId = contractIds[0];

    const fulfillResp = await fetch(
      `${APPSTLE_BASE}/subscription-contract-details/subscription-fulfillments/${contractId}`,
      { headers: { 'X-API-Key': apiKey } }
    );
    if (!fulfillResp.ok) {
      const detail = await fulfillResp.text();
      res.status(fulfillResp.status).json({ error: 'Could not load current box', detail });
      return;
    }
    const fulfillment = await fulfillResp.json();

    res.status(200).json({ hasSubscription: true, contractId, fulfillment });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error', detail: String(err) });
  }
};
