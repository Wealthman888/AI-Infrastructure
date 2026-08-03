const crypto = require('crypto');

// Verifies a Shopify App Proxy request. Shopify signs every proxied request
// by HMAC-SHA256'ing the sorted, concatenated (no separator) query params
// (excluding `signature` itself) with the app's client secret. This is the
// only trustworthy way to know which real, logged-in Shopify customer is
// calling this endpoint — never trust a client-supplied customer id.
function verifyProxySignature(query, secret) {
  if (!secret) return false;
  const { signature, ...rest } = query;
  if (!signature) return false;
  const sorted = Object.keys(rest)
    .sort()
    .map((key) => {
      const val = Array.isArray(rest[key]) ? rest[key].join(',') : rest[key];
      return `${key}=${val}`;
    })
    .join('');
  const digest = crypto.createHmac('sha256', secret).update(sorted).digest('hex');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getVerifiedCustomerId(req) {
  if (!verifyProxySignature(req.query, process.env.SHOPIFY_PROXY_SECRET)) return null;
  const id = req.query.logged_in_customer_id;
  if (!id || id === '0') return null;
  return String(id);
}

module.exports = { verifyProxySignature, getVerifiedCustomerId };
