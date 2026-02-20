/**
 * Twilio webhook signature validation using Web Crypto API.
 * Cloudflare Workers compatible (no Node.js crypto module needed).
 */

export async function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string
): Promise<boolean> {
  // Build the string to sign: url + sorted params (key+value)
  const sortedKeys = Object.keys(params).sort();
  const stringToSign =
    url + sortedKeys.map((k) => k + params[k]).join('');

  // HMAC-SHA1 using Web Crypto
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(stringToSign)
  );

  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
  return computed === signature;
}

/**
 * Parse application/x-www-form-urlencoded body into a plain object.
 */
export function parseFormBody(body: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of body.split('&')) {
    const [key, value] = pair.split('=').map(decodeURIComponent);
    if (key) params[key] = value ?? '';
  }
  return params;
}

/** Build a TwiML XML string */
export function buildTwiML(content: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
