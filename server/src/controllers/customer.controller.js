// Admin: customer management.
import mongoose from 'mongoose';

import Order from '../models/order.model.js';
import Review from '../models/review.model.js';
import User from '../models/user.model.js';
import { ah, escapeRegex, HttpError, paging, text } from '../utils/http.js';

// GET /admin/customers — accounts with order count, total spent and last order.
export const listCustomers = ah(async (req, res) => {
  const { page, limit, skip } = paging(req.query, 25, 100);
  const match = {};
  if (req.query.role === 'ADMIN' || req.query.role === 'CUSTOMER') match.role = req.query.role;
  if (req.query.status === 'active') match.active = true;
  if (req.query.status === 'blocked') match.active = false;
  const q = text(req.query.q, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    match.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  const sorts = { newest: { createdAt: -1 }, name: { name: 1 }, spent: { spent: -1 }, orders: { orders: -1 } };

  const [rows, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'orders',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$uid'] } } },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                spent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$total', 0] } },
                lastOrder: { $max: '$createdAt' },
              },
            },
          ],
          as: 'stats',
        },
      },
      {
        $addFields: {
          orders: { $ifNull: [{ $first: '$stats.orders' }, 0] },
          spent: { $ifNull: [{ $first: '$stats.spent' }, 0] },
          lastOrder: { $first: '$stats.lastOrder' },
        },
      },
      { $project: { password: 0, stats: 0, addresses: 0, tokenVersion: 0 } },
      { $sort: sorts[req.query.sort] || sorts.newest },
      { $skip: skip },
      { $limit: limit },
    ]),
    User.countDocuments(match),
  ]);

  res.json({ success: true, customers: rows, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

const loadUser = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid customer id.');
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'Customer not found.');
  return user;
};

// GET /admin/customers/:id — profile, addresses, orders and totals.
export const getCustomer = ah(async (req, res) => {
  const user = await loadUser(req.params.id);
  const [orders, reviews] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(100)
      .select('orderNumber total orderStatus paymentStatus paymentMethod createdAt items.quantity'),
    Review.countDocuments({ user: user._id }),
  ]);
  const spent = orders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0);
  res.json({
    success: true,
    customer: {
      _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, active: user.active,
      createdAt: user.createdAt, lastLoginAt: user.lastLoginAt, addresses: user.addresses,
    },
    orders,
    stats: { orders: orders.length, spent, reviews },
  });
});

// PATCH /admin/customers/:id — { active, role }
export const updateCustomer = ah(async (req, res) => {
  const user = await loadUser(req.params.id);
  const self = user._id.equals(req.user._id);

  if (req.body.active !== undefined) {
    const active = Boolean(req.body.active);
    if (self && !active) throw new HttpError(400, "You can't block your own account.");
    if (user.active !== active) {
      user.active = active;
      if (!active) user.tokenVersion = (user.tokenVersion || 0) + 1; // signs them out
    }
  }
  if (req.body.role !== undefined) {
    if (!['CUSTOMER', 'ADMIN'].includes(req.body.role)) throw new HttpError(400, 'Invalid role.');
    if (self && req.body.role !== 'ADMIN') throw new HttpError(400, "You can't remove your own admin access.");
    user.role = req.body.role;
  }
  await user.save();
  res.json({ success: true, message: 'Customer updated.', customer: { _id: user._id, active: user.active, role: user.role } });
});

// DELETE /admin/customers/:id — only accounts without orders (others can be blocked instead).
export const deleteCustomer = ah(async (req, res) => {
  const user = await loadUser(req.params.id);
  if (user._id.equals(req.user._id)) throw new HttpError(400, "You can't delete your own account.");
  if (await Order.exists({ user: user._id })) {
    throw new HttpError(400, 'This customer has orders, so the account is kept for your records. Block it instead.');
  }
  const reviewed = await Review.find({ user: user._id }).distinct('product');
  await Review.deleteMany({ user: user._id });
  for (const productId of reviewed) await Review.refreshProductRating(productId);
  await user.deleteOne();
  res.json({ success: true, message: 'Customer deleted.' });
});
