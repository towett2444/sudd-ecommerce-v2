// Card payments through Paystack (supports Kenyan cards and KES).
// Set PAYSTACK_SECRET_KEY (sk_test_... or sk_live_...) to turn it on.
// Without it, card payments run in test mode (no card details are collected, no real money).
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.paystack.co';

export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

const call = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status !== true) throw new Error(data.message || 'The card payment service did not respond.');
  return data.data;
};

// Starts a payment; the customer is sent to `authorizationUrl` to enter card details on Paystack's page.
export const initialize = async ({ email, amount, reference, callbackUrl, metadata }) => {
  const data = await call('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // in cents
      currency: 'KES',
      reference,
      callback_url: callbackUrl,
      channels: ['card'],
      metadata,
    }),
  });
  return { authorizationUrl: data.authorization_url, reference: data.reference };
};

// Returns { state: 'PAID' | 'FAILED' | 'PENDING', amount, currency, message, transactionId }.
export const verify = async (reference) => {
  const data = await call(`/transaction/verify/${encodeURIComponent(reference)}`);
  const state = data.status === 'success' ? 'PAID' : ['failed', 'reversed', 'abandoned'].includes(data.status) ? 'FAILED' : 'PENDING';
  return {
    state,
    amount: Number(data.amount || 0) / 100,
    currency: data.currency,
    message: data.gateway_response || data.status,
    transactionId: data.id ? String(data.id) : '',
  };
};

// Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key.
export const validWebhookSignature = (rawBody, signature) => {
  if (!paystackConfigured() || !signature || !rawBody) return false;
  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && timingSafeEqual(a, b);
};
