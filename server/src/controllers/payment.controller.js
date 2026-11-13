// Payments: M-Pesa STK push, card (Paystack), and test mode when a provider has no keys yet.
import mongoose from 'mongoose';

import Order from '../models/order.model.js';
import * as mpesa from '../services/mpesa.js';
import { markPaid, markPaymentFailed } from '../services/orders.js';
import * as paystack from '../services/paystack.js';
import { ah, HttpError, normalizeKenyanPhone } from '../utils/http.js';

const demoAllowed = () => process.env.NODE_ENV !== 'production';

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const loadOwnOrder = async (req) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) throw new HttpError(400, 'Invalid order ID.');
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) throw new HttpError(404, 'Order not found.');
  return order;
};

const assertPayable = (order) => {
  if (order.paymentStatus === 'PAID') throw new HttpError(400, 'This order is already paid.');
  if (order.orderStatus === 'CANCELLED') throw new HttpError(400, 'This order was cancelled. Please place a new order.');
};

const view = (order) => ({
  orderId: order._id,
  orderNumber: order.orderNumber,
  total: order.total,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  payment: {
    provider: order.payment.provider,
    phone: order.payment.phone,
    receipt: order.payment.receipt,
    message: order.payment.lastMessage,
    demo: order.payment.demo,
    awaiting: Boolean(order.payment.checkoutRequestId || order.payment.reference) && order.paymentStatus === 'PENDING',
  },
  paidAt: order.paidAt,
});

// GET /payments/options — which payment methods are live and which run in test mode.
export const paymentOptions = (req, res) => {
  res.json({
    success: true,
    mpesa: { live: mpesa.mpesaConfigured(), environment: process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox' },
    card: { live: paystack.paystackConfigured() },
    cod: true,
    testModeAllowed: demoAllowed(),
  });
};

// POST /payments/:orderId/mpesa — { phone } sends the M-Pesa prompt to the phone.
export const startMpesa = ah(async (req, res) => {
  const order = await loadOwnOrder(req);
  assertPayable(order);
  if (order.paymentMethod === 'COD') throw new HttpError(400, 'This order is set to pay on delivery.');

  const phone = normalizeKenyanPhone(req.body.phone || order.payment.phone || order.shippingAddress.phone);
  if (!phone) throw new HttpError(400, 'Enter a valid M-Pesa number, e.g. 0712 345 678.');

  // Limit retries so a phone isn't spammed with prompts
  if (order.payment.attempts >= 8) throw new HttpError(429, 'Too many payment attempts. Please contact us or place the order again.');

  order.paymentMethod = 'MPESA';
  order.payment.phone = phone;
  order.payment.attempts += 1;
  order.payment.reference = '';
  order.paymentStatus = 'PENDING';

  if (mpesa.mpesaConfigured()) {
    try {
      const result = await mpesa.stkPush({
        phone,
        amount: order.total,
        accountReference: order.orderNumber.replace(/^SUD-/, ''),
        description: 'Sudd Shop',
      });
      order.payment.provider = 'mpesa';
      order.payment.demo = false;
      order.payment.checkoutRequestId = result.checkoutRequestId;
      order.payment.lastMessage = result.message;
    } catch (error) {
      order.payment.lastMessage = error.message;
      await order.save();
      throw new HttpError(502, error.message);
    }
  } else {
    if (!demoAllowed()) throw new HttpError(503, 'M-Pesa payments are not set up yet. Please choose another payment method.');
    order.payment.provider = 'demo';
    order.payment.demo = true;
    order.payment.checkoutRequestId = `demo-${order._id}-${Date.now()}`;
    order.payment.lastMessage = 'Test mode: no real prompt is sent. Use the buttons to simulate the customer\'s response.';
  }

  await order.save();
  res.json({ success: true, message: order.payment.lastMessage, ...view(order) });
});

// POST /payments/:orderId/card — returns Paystack's payment page URL (or test mode).
export const startCard = ah(async (req, res) => {
  const order = await loadOwnOrder(req);
  assertPayable(order);
  if (order.paymentMethod === 'COD') throw new HttpError(400, 'This order is set to pay on delivery.');
  if (order.payment.attempts >= 8) throw new HttpError(429, 'Too many payment attempts. Please contact us or place the order again.');

  order.paymentMethod = 'CARD';
  order.payment.attempts += 1;
  order.payment.checkoutRequestId = '';
  order.paymentStatus = 'PENDING';
  const reference = `${order.orderNumber}-${order.payment.attempts}-${Date.now().toString(36)}`;

  let authorizationUrl = null;
  if (paystack.paystackConfigured()) {
    try {
      const result = await paystack.initialize({
        email: order.shippingAddress.email,
        amount: order.total,
        reference,
        callbackUrl: `${clientUrl()}/orders/${order._id}/pay`,
        metadata: { orderId: String(order._id), orderNumber: order.orderNumber },
      });
      authorizationUrl = result.authorizationUrl;
      order.payment.provider = 'paystack';
      order.payment.demo = false;
      order.payment.reference = result.reference;
      order.payment.lastMessage = 'Complete the payment on the secure card page.';
    } catch (error) {
      order.payment.lastMessage = error.message;
      await order.save();
      throw new HttpError(502, error.message);
    }
  } else {
    if (!demoAllowed()) throw new HttpError(503, 'Card payments are not set up yet. Please choose another payment method.');
    order.payment.provider = 'demo';
    order.payment.demo = true;
    order.payment.reference = reference;
    order.payment.lastMessage = 'Test mode: no card details are collected. Use the buttons to simulate the result.';
  }

  await order.save();
  res.json({ success: true, authorizationUrl, message: order.payment.lastMessage, ...view(order) });
});

// Asks the provider about a pending payment (rate-limited per order).
const refreshFromProvider = async (order) => {
  if (order.paymentStatus !== 'PENDING' || order.payment.demo) return;
  if (order.payment.lastCheckedAt && Date.now() - order.payment.lastCheckedAt.getTime() < 4000) return;
  order.payment.lastCheckedAt = new Date();

  try {
    if (order.paymentMethod === 'MPESA' && order.payment.checkoutRequestId && mpesa.mpesaConfigured()) {
      const result = await mpesa.stkQuery(order.payment.checkoutRequestId);
      if (result.state === 'PAID') {
        await markPaid(order, { provider: 'mpesa', note: 'M-Pesa payment confirmed.' });
        return;
      }
      if (result.state === 'FAILED') {
        await markPaymentFailed(order, result.message);
        return;
      }
      order.payment.lastMessage = result.message;
    } else if (order.paymentMethod === 'CARD' && order.payment.reference && paystack.paystackConfigured()) {
      const result = await paystack.verify(order.payment.reference);
      if (result.state === 'PAID') {
        if (result.currency !== 'KES' || Math.round(result.amount) < Math.round(order.total)) {
          await markPaymentFailed(order, 'The amount paid does not match the order total. Please contact us.');
          return;
        }
        await markPaid(order, { provider: 'paystack', receipt: result.transactionId, amount: result.amount, note: 'Card payment confirmed.' });
        return;
      }
      if (result.state === 'FAILED') {
        await markPaymentFailed(order, `Card payment failed: ${result.message}`);
        return;
      }
    }
  } catch (error) {
    order.payment.lastMessage = `Couldn't check the payment yet (${error.message}). We'll keep trying.`;
  }
  await order.save();
};

// GET /payments/:orderId/status — current payment state; checks with the provider while pending.
export const paymentStatus = ah(async (req, res) => {
  const order = await loadOwnOrder(req);
  await refreshFromProvider(order);
  res.json({ success: true, ...view(order) });
});

// POST /payments/:orderId/test-result — { result: 'success' | 'failed' } (test mode only, never in production)
export const testResult = ah(async (req, res) => {
  if (!demoAllowed()) throw new HttpError(404, 'Not found.');
  const order = await loadOwnOrder(req);
  if (!order.payment.demo) throw new HttpError(400, 'This payment is not in test mode.');
  assertPayable(order);

  if (req.body.result === 'success') {
    const receipt = order.paymentMethod === 'MPESA'
      ? `TEST${Math.random().toString(36).slice(2, 10).toUpperCase()}`
      : `test_${Date.now()}`;
    await markPaid(order, { provider: 'demo', receipt, note: 'Test payment (no real money).' });
  } else {
    await markPaymentFailed(
      order,
      order.paymentMethod === 'MPESA' ? 'The payment request was cancelled on the phone. (test)' : 'The card was declined. (test)',
    );
  }
  res.json({ success: true, ...view(order) });
});

// POST /payments/mpesa/callback — called by Safaricom when the customer finishes (or cancels) the prompt.
export const mpesaCallback = ah(async (req, res) => {
  // Always answer Safaricom with success, otherwise it keeps retrying.
  const ack = () => res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  if (process.env.MPESA_CALLBACK_TOKEN && req.query.token !== process.env.MPESA_CALLBACK_TOKEN) return ack();

  const cb = mpesa.parseCallback(req.body);
  if (!cb) return ack();

  const order = await Order.findOne({ 'payment.checkoutRequestId': cb.checkoutRequestId });
  if (!order) return ack();

  if (cb.resultCode === '0') {
    if (Math.round(cb.amount) < Math.ceil(order.total)) {
      await markPaymentFailed(order, `M-Pesa amount ${cb.amount} does not match the order total. Please contact us.`);
    } else {
      await markPaid(order, { provider: 'mpesa', receipt: cb.receipt, amount: cb.amount, note: 'M-Pesa payment received.' });
    }
  } else {
    await markPaymentFailed(order, mpesa.describeResult(cb.resultCode, cb.resultDesc));
  }
  return ack();
});

// POST /payments/paystack/webhook — Paystack's signed notification (needs the raw body).
export const paystackWebhook = ah(async (req, res) => {
  const raw = req.body instanceof Buffer ? req.body : Buffer.from('');
  if (!paystack.validWebhookSignature(raw, req.headers['x-paystack-signature'])) return res.sendStatus(401);

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.sendStatus(400); }

  if (event?.event === 'charge.success' && event.data?.reference) {
    const order = await Order.findOne({ 'payment.reference': event.data.reference });
    if (order) {
      // Confirm with Paystack rather than trusting the webhook body alone.
      order.payment.lastCheckedAt = null;
      await refreshFromProvider(order);
    }
  }
  res.sendStatus(200);
});
