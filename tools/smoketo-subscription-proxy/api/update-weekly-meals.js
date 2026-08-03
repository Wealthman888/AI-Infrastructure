const { getVerifiedCustomerId } = require('../lib/verifyProxy');

const APPSTLE_BASE = 'https://subscription-admin.appstle.com/api/external/v2';

// Updates the signed-in customer's ALREADY-ACTIVE subscription contract to
// match their new weekly meal selection — no cart, no checkout. Only ever
// touches the caller's own contract: the customer id comes from Shopify's
// signed app-proxy request, never from the request body.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
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

  const shop = req.query.shop;
  const body = req.body || {};
  const newVariants = body.newVariants;         // { variantId: quantity, ... } — this week's full meal selection
  const oldVariants = body.oldVariants || [];    // [variantId, ...] — everything currently on the contract being replaced
  const newOneTimeVariants = body.newOneTimeVariants || {};
  const oldOneTimeVariants = body.oldOneTimeVariants || [];

  if (!newVariants || typeof newVariants !== 'object' || Object.keys(newVariants).length === 0) {
    res.status(400).json({ error: 'newVariants is required and must contain at least one meal' });
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
      res.status(404).json({ error: 'No active subscription found for this customer' });
      return;
    }
    const contractId = contractIds[0];

    const replaceBody = {
      contractId,
      shop,
      eventSource: 'MERCHANT_EXTERNAL_API',
      newVariants,
      oldVariants,
      newOneTimeVariants,
      oldOneTimeVariants,
      carryForwardDiscount: 'PRODUCT_THEN_EXISTING',
      babRequireAllSourceVariants: false,
      // Weekly meal-picking is routine, expected activity — the storefront
      // already shows its own confirmation, so we don't also trigger
      // Appstle's "your subscription changed" email every single week.
      stopSwapEmails: true,
    };

    const replaceResp = await fetch(`${APPSTLE_BASE}/subscription-contract-details/replace-variants-v3`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(replaceBody),
    });
    const result = await replaceResp.json();
    if (!replaceResp.ok) {
      res.status(replaceResp.status).json({ error: 'Appstle update failed', detail: result });
      return;
    }

    res.status(200).json({ success: true, contract: result });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error', detail: String(err) });
  }
};
