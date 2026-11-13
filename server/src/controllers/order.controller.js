import mongoose from 'mongoose';

import { deliveryQuote, KENYA_COUNTIES } from '../config/store.js';
import Order, { ORDER_STATUSES, PAYMENT_METHODS } from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import { addHistory, cancelOrder, changeStatus, markPaid, reserveStock } from '../services/orders.js';
import { ah, escapeRegex, HttpError, normalizeKenyanPhone, paging, text } from '../utils/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readAddress = (a, { needEmail }) => {
  if (!a || typeof a !== 'object') throw new HttpError(400, 'Delivery address is required.');
  const address = {
    firstName: text(a.firstName, 60),
    lastName: text(a.lastName, 60),
    email: text(a.email, 120).toLowerCase(),
    phone: text(a.phone, 20),
    street: text(a.street),
    apartment: text(a.apartment),
    city: text(a.city, 80),
    county: text(a.county, 40),
    postalCode: text(a.postalCode, 12),
    country: 'Kenya',
  };
  const required = ['firstName', 'lastName', 'phone', 'street', 'city', 'county', ...(needEmail ? ['email'] : [])];
  if (required.some((k) => !address[k])) throw new HttpError(400, 'Please fill in all required delivery details.');
  if (address.email && !EMAIL_RE.test(address.email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (!normalizeKenyanPhone(address.phone)) throw new HttpError(400, 'Enter a valid Kenyan phone number, e.g. 0712 345 678.');
  if (!KENYA_COUNTIES.includes(address.county)) throw new HttpError(400, 'Please choose your county from the list.');
  return address;
};

// POST /orders — place an order. Prices, delivery fee and totals are always worked out here, never trusted from the browser.
export const createOrder = ah(async (req, res) => {
  const { items, shippingAddress, billingAddress, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Your cart is empty.');
  if (items.length > 50) throw new HttpError(400, 'Too many different items in one order.');
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Choose a payment method.');

  const shipping = readAddress(shippingAddress, { needEmail: true });

  let billing = { sameAsShipping: true };
  if (billingAddress && billingAddress.sameAsShipping === false) {
    billing = {
      ...readAddress(billingAddress, { needEmail: false }),
      sameAsShipping: false,
      companyName: text(billingAddress.companyName, 100),
      kraPin: text(billingAddress.kraPin, 20).toUpperCase(),
    };
  } else if (billingAddress) {
    billing.companyName = text(billingAddress.companyName, 100);
    billing.kraPin = text(billingAddress.kraPin, 20).toUpperCase();
  }
  if (billing.kraPin && !/^[AP]\d{9}[A-Z]$/.test(billing.kraPin)) {
    throw new HttpError(400, 'KRA PIN should look like A123456789B.');
  }

  if (items.some((i) => typeof i?.productId !== 'string' || !mongoose.Types.ObjectId.isValid(i.productId))) {
    throw new HttpError(400, 'One or more cart items contain an invalid product ID.');
  }

  const products = await Product.find({ _id: { $in: [...new Set(items.map((i) => i.productId))] } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = [];
  let subtotal = 0;
  let discountTotal = 0;

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || !product.active) throw new HttpError(404, 'One or more products in your cart are no longer available.');

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new HttpError(400, `Invalid quantity for ${product.name}.`);

    let size = null;
    if (product.sizes?.length) {
      if (!product.sizes.includes(item.size)) throw new HttpError(400, `Please select a valid size for ${product.name}.`);
      size = item.size;
    }
    let color = null;
    if (product.colors?.length) {
      if (!product.colors.includes(item.color)) throw new HttpError(400, `Please select a valid color for ${product.name}.`);
      color = item.color;
    }

    subtotal += product.price * quantity;
    if (product.compareAtPrice > product.price) discountTotal += (product.compareAtPrice - product.price) * quantity;

    lines.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice > product.price ? product.compareAtPrice : null,
      size,
      color,
      quantity,
    });
  }

  const delivery = deliveryQuote(shipping.county, subtotal);

  // M-Pesa number to charge (defaults to the delivery phone)
  let mpesaPhone = '';
  if (paymentMethod === 'MPESA') {
    mpesaPhone = normalizeKenyanPhone(req.body.mpesaPhone || shipping.phone);
    if (!mpesaPhone) throw new HttpError(400, 'Enter the M-Pesa phone number to charge, e.g. 0712 345 678.');
  }

  await reserveStock(lines);

  let order;
  try {
    order = new Order({
      orderNumber: await Order.newOrderNumber(),
      user: req.user._id,
      items: lines,
      shippingAddress: shipping,
      billingAddress: billing,
      paymentMethod,
      paymentStatus: 'PENDING',
      payment: { provider: paymentMethod === 'COD' ? 'cash' : '', phone: mpesaPhone },
      orderStatus: 'PENDING',
      deliveryZone: delivery.zone,
      deliveryDays: delivery.days,
      customerNote: text(req.body.customerNote, 500),
      subtotal,
      discountTotal,
      deliveryFee: delivery.fee,
      total: subtotal + delivery.fee,
    });
    addHistory(
      order,
      'PLACED',
      paymentMethod === 'COD' ? 'Order placed. Pay with cash or M-Pesa when it is delivered.' : 'Order placed. Waiting for payment.',
      'customer',
    );
    await order.save();
  } catch (error) {
    for (const l of lines) await Product.updateOne({ _id: l.product }, { $inc: { stock: l.quantity, soldCount: -l.quantity } });
    await Product.syncInStock(lines.map((l) => l.product));
    throw error;
  }

  // Remember the address for next time
  if (req.body.saveAddress) {
    const user = await User.findById(req.user._id);
    const duplicate = user.addresses.some((a) => a.street === shipping.street && a.city === shipping.city && a.phone === shipping.phone);
    if (!duplicate && user.addresses.length < 10) {
      user.addresses.push({ ...shipping, label: text(req.body.addressLabel, 30) || 'Home', isDefault: user.addresses.length === 0 });
      await user.save();
    }
  }

  res.status(201).json({ success: true, message: 'Order placed.', order });
});

const findOwnOrder = async (req) => {
  const { orderId } = req.params;
  const filter = mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: String(orderId).toUpperCase() };
  const order = await Order.findOne({ ...filter, ...(req.user.role !== 'ADMIN' && { user: req.user._id }) });
  if (!order) throw new HttpError(404, 'Order not found.');
  return order;
};

// GET /orders/:orderId — by id or order number.
export const getOrderById = ah(async (req, res) => {
  res.json({ success: true, order: await findOwnOrder(req) });
});

// GET /orders — the customer's orders.
export const getMyOrders = ah(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status === 'open') filter.orderStatus = { $in: ['PENDING', 'PROCESSING', 'SHIPPED'] };
  else if (ORDER_STATUSES.includes(req.query.status)) filter.orderStatus = req.query.status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, count: orders.length, orders });
});

// POST /orders/:orderId/cancel — customers can cancel until the order is being prepared.
export const cancelMyOrder = ah(async (req, res) => {
  const order = await findOwnOrder(req);
  if (order.orderStatus !== 'PENDING') {
    throw new HttpError(400, 'This order is already being prepared. Contact us if you need to change it.');
  }
  if (order.paymentStatus === 'PAID') {
    throw new HttpError(400, 'This order has been paid. Contact us to cancel it and arrange a refund.');
  }
  await cancelOrder(order, { reason: text(req.body.reason, 200) || 'Cancelled by customer.', by: 'customer' });
  res.json({ success: true, message: 'Order cancelled.', order });
});

// ---------- admin ----------

// GET /orders/admin/all — search, filters and pages.
export const getAllOrders = ah(async (req, res) => {
  const { page, limit, skip } = paging(req.query, 25, 200);
  const filter = {};
  if (ORDER_STATUSES.includes(req.query.status)) filter.orderStatus = req.query.status;
  if (['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(req.query.payment)) filter.paymentStatus = req.query.payment;
  if (PAYMENT_METHODS.includes(req.query.method)) filter.paymentMethod = req.query.method;
  if (req.query.user && mongoose.Types.ObjectId.isValid(req.query.user)) filter.user = req.query.user;
  const from = Date.parse(req.query.from);
  const to = Date.parse(req.query.to);
  if (Number.isFinite(from) || Number.isFinite(to)) {
    filter.createdAt = {};
    if (Number.isFinite(from)) filter.createdAt.$gte = new Date(`${req.query.from}T00:00:00+03:00`);
    if (Number.isFinite(to)) filter.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999+03:00`);
  }
  const q = text(req.query.q, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [
      { orderNumber: re },
      { 'shippingAddress.firstName': re },
      { 'shippingAddress.lastName': re },
      { 'shippingAddress.email': re },
      { 'shippingAddress.phone': re },
      { 'payment.receipt': re },
    ];
  }

  const [orders, total, counts] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$orderStatus', n: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    orders,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    statusCounts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
  });
});

// PATCH /orders/admin/:orderId/status — { status, note, courier, trackingNumber }
export const updateOrderStatus = ah(async (req, res) => {
  const order = await findOwnOrder(req);
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid order status.');
  await changeStatus(order, status, {
    note: text(req.body.note, 300),
    by: req.user.name,
    courier: req.body.courier !== undefined ? text(req.body.courier, 60) : undefined,
    trackingNumber: req.body.trackingNumber !== undefined ? text(req.body.trackingNumber, 60) : undefined,
  });
  res.json({ success: true, message: 'Order status updated.', order });
});

// PATCH /orders/admin/:orderId/payment — { status: PAID | REFUNDED | FAILED, receipt, note }
export const updatePaymentStatus = ah(async (req, res) => {
  const order = await findOwnOrder(req);
  const { status } = req.body;
  const note = text(req.body.note, 300);

  if (status === 'PAID') {
    if (order.paymentStatus === 'PAID') throw new HttpError(400, 'This order is already marked as paid.');
    await markPaid(order, {
      provider: order.paymentMethod === 'COD' ? 'cash' : order.payment.provider || 'manual',
      receipt: text(req.body.receipt, 40),
      note: note || 'Payment confirmed by admin.',
      by: req.user.name,
    });
  } else if (status === 'REFUNDED') {
    if (order.paymentStatus !== 'PAID') throw new HttpError(400, 'Only paid orders can be refunded.');
    order.paymentStatus = 'REFUNDED';
    addHistory(order, 'REFUNDED', note || 'Payment refunded.', req.user.name);
    await order.save();
  } else if (status === 'FAILED' || status === 'PENDING') {
    if (order.paymentStatus === 'PAID') throw new HttpError(400, 'Use "Refunded" for a paid order.');
    order.paymentStatus = status;
    addHistory(order, status === 'FAILED' ? 'PAYMENT_FAILED' : 'PAYMENT_PENDING', note, req.user.name);
    await order.save();
  } else {
    throw new HttpError(400, 'Invalid payment status.');
  }
  res.json({ success: true, message: 'Payment status updated.', order });
});
