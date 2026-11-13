// M-Pesa Express (STK push) through Safaricom Daraja.
// Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE and MPESA_PASSKEY to go live
// (sandbox or production). Without them the store runs M-Pesa in test mode (no real money).

const BASES = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

export const mpesaConfigured = () =>
  Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY,
  );

const base = () => BASES[process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox'];

let cachedToken = null;

const getToken = async () => {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const response = await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`M-Pesa sign-in failed (${response.status}). Check MPESA_CONSUMER_KEY/SECRET.`);
  const data = await response.json();
  cachedToken = { value: data.access_token, expires: Date.now() + (Number(data.expires_in || 3599) - 60) * 1000 };
  return cachedToken.value;
};

// Daraja wants the timestamp in Kenyan time: YYYYMMDDHHmmss
const timestamp = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

const password = (ts) =>
  Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`).toString('base64');

const post = async (path, body) => {
  const response = await fetch(`${base()}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
};

export const callbackUrl = () => {
  const explicit = process.env.MPESA_CALLBACK_URL;
  const token = process.env.MPESA_CALLBACK_TOKEN ? `?token=${encodeURIComponent(process.env.MPESA_CALLBACK_TOKEN)}` : '';
  if (explicit) return `${explicit}${explicit.includes('?') ? '' : token}`;
  if (process.env.API_PUBLIC_URL?.startsWith('https://')) {
    return `${process.env.API_PUBLIC_URL.replace(/\/$/, '')}/api/v1/payments/mpesa/callback${token}`;
  }
  // Daraja requires a URL even when it can't reach us (e.g. on localhost); payment status is
  // then confirmed by asking Daraja directly (stkQuery).
  return 'https://example.com/mpesa/callback';
};

// Sends the payment prompt to the customer's phone. Returns { checkoutRequestId, message }.
export const stkPush = async ({ phone, amount, accountReference, description }) => {
  const ts = timestamp();
  const { ok, data } = await post('/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password(ts),
    Timestamp: ts,
    TransactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: phone,
    PartyB: process.env.MPESA_PARTY_B || process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: callbackUrl(),
    AccountReference: String(accountReference).slice(0, 12),
    TransactionDesc: String(description).slice(0, 13),
  });
  if (!ok || data.ResponseCode !== '0') {
    throw new Error(data.errorMessage || data.ResponseDescription || 'M-Pesa could not send the payment request.');
  }
  return { checkoutRequestId: data.CheckoutRequestID, message: data.CustomerMessage || 'Check your phone to complete the payment.' };
};

// Asks Daraja how an STK request ended.
// Returns { state: 'PENDING' | 'PAID' | 'FAILED', message }.
export const stkQuery = async (checkoutRequestId) => {
  const ts = timestamp();
  const { data } = await post('/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password(ts),
    Timestamp: ts,
    CheckoutRequestID: checkoutRequestId,
  });
  if (data.errorCode) {
    // e.g. 500.001.1001 "The transaction is being processed"
    return { state: 'PENDING', message: data.errorMessage || 'Waiting for the customer to enter their PIN.' };
  }
  const code = String(data.ResultCode);
  if (code === '0') return { state: 'PAID', message: data.ResultDesc || 'Payment received.' };
  return { state: 'FAILED', message: describeResult(code, data.ResultDesc) };
};

export const describeResult = (code, desc) =>
  ({
    1032: 'The payment request was cancelled on the phone.',
    1037: 'The phone could not be reached or the request timed out. Make sure it is on and try again.',
    1: 'Not enough M-Pesa balance to complete the payment.',
    2001: 'The M-Pesa PIN entered was wrong.',
    1019: 'The payment request expired. Please try again.',
  })[code] || desc || 'The M-Pesa payment did not go through.';

// Reads Daraja's callback body. Returns null if it isn't an STK callback.
export const parseCallback = (body) => {
  const cb = body?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return null;
  const items = Object.fromEntries((cb.CallbackMetadata?.Item || []).map((i) => [i.Name, i.Value]));
  return {
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: String(cb.ResultCode),
    resultDesc: cb.ResultDesc,
    amount: Number(items.Amount || 0),
    receipt: items.MpesaReceiptNumber ? String(items.MpesaReceiptNumber) : '',
    phone: items.PhoneNumber ? String(items.PhoneNumber) : '',
  };
};
