// Order bookkeeping shared by checkout, payments and the admin: stock, payment and status changes.
import { UNPAID_ORDER_TIMEOUT_MINUTES } from '../config/store.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { HttpError } from '../utils/http.js';

// Takes stock for every line, all or nothing. Lines for the same product are combined first.
export const reserveStock = async (lines) => {
  const totals = new Map();
  for (const l of lines) totals.set(String(l.product), (totals.get(String(l.product)) || 0) + l.quantity);

  const done = [];
  try {
    for (const [id, qty] of totals) {
      const result = await Product.updateOne(
        { _id: id, active: true, stock: { $gte: qty } },
        { $inc: { stock: -qty, soldCount: qty } },
      );
      if (result.modifiedCount !== 1) {
        const p = await Product.findById(id).select('name stock');
        throw new HttpError(
          409,
          p && p.stock > 0
            ? `Only ${p.stock} of "${p.name}" left. Please reduce the quantity in your cart.`
            : `"${p?.name || 'An item'}" just sold out. Please remove it from your cart.`,
        );
      }
      done.push([id, qty]);
    }
  } catch (error) {
    for (const [id, qty] of done) await Product.updateOne({ _id: id }, { $inc: { stock: qty, soldCount: -qty } });
    await Product.syncInStock(done.map(([id]) => id));
    throw error;
  }
  await Product.syncInStock([...totals.keys()]);
};

// Puts an order's stock back (once).
export const releaseStock = async (order) => {
  const claimed = await Order.updateOne({ _id: order._id, stockRestored: false }, { stockRestored: true });
  if (claimed.modifiedCount !== 1) return;
  for (const item of order.items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity, soldCount: -item.quantity } });
  }
  await Product.syncInStock(order.items.map((i) => i.product));
  order.stockRestored = true;
};

const addHistory = (order, status, note, by = '') => {
  order.statusHistory.push({ status, note, by, at: new Date() });
};

// Records a successful payment. Safe to call more than once (callback + status check).
export const markPaid = async (order, { provider, receipt = '', amount = order.total, note = '', by = 'system' }) => {
  if (order.paymentStatus === 'PAID') return order;
  if (order.orderStatus === 'CANCELLED') {
    // Paid after the order was cancelled (e.g. late M-Pesa confirmation): keep it visible for a refund.
    order.payment.lastMessage = 'Payment arrived after the order was cancelled — refund needed.';
  }
  order.paymentStatus = 'PAID';
  order.paidAt = new Date();
  order.payment.provider = provider;
  order.payment.receipt = receipt || order.payment.receipt;
  order.payment.amountPaid = amount;
  if (order.orderStatus !== 'CANCELLED') order.payment.lastMessage = 'Payment received.';
  addHistory(order, 'PAID', note || `Payment received${receipt ? ` (${receipt})` : ''}.`, by);
  if (order.orderStatus === 'PENDING') {
    order.orderStatus = 'PROCESSING';
    addHistory(order, 'PROCESSING', 'We are preparing your order.', by);
  }
  await order.save();
  return order;
};

export const markPaymentFailed = async (order, message) => {
  if (order.paymentStatus === 'PAID') return order;
  order.paymentStatus = 'FAILED';
  order.payment.lastMessage = message;
  addHistory(order, 'PAYMENT_FAILED', message);
  await order.save();
  return order;
};

export const cancelOrder = async (order, { reason = '', by = 'system' } = {}) => {
  if (order.orderStatus === 'CANCELLED') return order;
  if (['SHIPPED', 'DELIVERED'].includes(order.orderStatus)) {
    throw new HttpError(400, 'Orders that have been shipped cannot be cancelled.');
  }
  order.orderStatus = 'CANCELLED';
  order.cancelReason = reason;
  addHistory(order, 'CANCELLED', reason || 'Order cancelled.', by);
  await order.save();
  await releaseStock(order);
  return order;
};

const NEXT = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'PENDING'],
  SHIPPED: ['DELIVERED', 'PROCESSING'],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_NOTES = {
  PROCESSING: 'We are preparing your order.',
  SHIPPED: 'Your order is on its way.',
  DELIVERED: 'Your order was delivered.',
  PENDING: 'Order moved back to pending.',
};

export const changeStatus = async (order, status, { note = '', by = 'admin', courier, trackingNumber } = {}) => {
  if (status === order.orderStatus) throw new HttpError(400, `The order is already ${status.toLowerCase()}.`);
  if (!NEXT[order.orderStatus].includes(status)) {
    throw new HttpError(400, `An order that is ${order.orderStatus.toLowerCase()} can't be changed to ${status.toLowerCase()}.`);
  }
  if (status === 'CANCELLED') return cancelOrder(order, { reason: note, by });

  if (courier !== undefined) order.courier = courier;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  order.orderStatus = status;
  addHistory(order, status, note || STATUS_NOTES[status] || '', by);

  // Cash on delivery: the cash is collected when the order is delivered.
  if (status === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID') {
    await order.save();
    return markPaid(order, { provider: 'cash', note: 'Cash collected on delivery.', by });
  }
  await order.save();
  return order;
};

export { addHistory };

// Cancels online-payment orders that were never paid, so their stock goes back on sale.
export const sweepUnpaidOrders = async () => {
  const cutoff = new Date(Date.now() - UNPAID_ORDER_TIMEOUT_MINUTES * 60 * 1000);
  const stale = await Order.find({
    paymentMethod: { $in: ['MPESA', 'CARD'] },
    paymentStatus: { $ne: 'PAID' },
    orderStatus: 'PENDING',
    createdAt: { $lt: cutoff },
  }).limit(100);
  for (const order of stale) {
    try {
      await cancelOrder(order, { reason: `Not paid within ${UNPAID_ORDER_TIMEOUT_MINUTES / 60} hours.` });
    } catch (error) {
      console.error('Auto-cancel failed for', order.orderNumber, error.message);
    }
  }
  if (stale.length) console.log(`Cancelled ${stale.length} unpaid order(s) and released their stock.`);
};
