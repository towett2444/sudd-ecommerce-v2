// Admin: sales and revenue reports. Dates are Kenyan days (UTC+3).
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import { ah, HttpError } from '../utils/http.js';

const TZ = '+03:00';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const nairobiToday = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

// GET /reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|week|month
// Revenue counts paid orders; "orders" counts everything that wasn't cancelled.
export const salesReport = ah(async (req, res) => {
  const to = DAY.test(req.query.to || '') ? req.query.to : nairobiToday();
  const from = DAY.test(req.query.from || '') ? req.query.from : addDays(to, -29);
  if (from > to) throw new HttpError(400, '"From" must be on or before "To".');
  const groupBy = ['day', 'week', 'month'].includes(req.query.groupBy) ? req.query.groupBy : 'day';

  const range = { createdAt: { $gte: new Date(`${from}T00:00:00${TZ}`), $lte: new Date(`${to}T23:59:59.999${TZ}`) } };
  const notCancelled = { ...range, orderStatus: { $ne: 'CANCELLED' } };
  const paid = { ...range, paymentStatus: 'PAID' };
  const fmt = { day: '%Y-%m-%d', week: '%G-W%V', month: '%Y-%m' }[groupBy];

  const [summary, series, byMethod, byStatus, topProducts, byCategory, byCounty, newCustomers, cancelled] = await Promise.all([
    Order.aggregate([
      { $match: notCancelled },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          gross: { $sum: '$total' },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$total', 0] } },
          paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] } },
          unpaid: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'PAID'] }, '$total', 0] } },
          deliveryFees: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$deliveryFee', 0] } },
          discounts: { $sum: '$discountTotal' },
          items: { $sum: { $sum: '$items.quantity' } },
          customers: { $addToSet: '$user' },
        },
      },
      { $addFields: { customers: { $size: '$customers' } } },
    ]),
    Order.aggregate([
      { $match: notCancelled },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: '$createdAt', timezone: TZ } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$total', 0] } },
          gross: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: notCancelled },
      {
        $group: {
          _id: '$paymentMethod',
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$total', 0] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([{ $match: range }, { $group: { _id: '$orderStatus', orders: { $sum: 1 }, value: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: paid },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $last: '$items.name' },
          image: { $last: '$items.image' },
          units: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: paid },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $ifNull: ['$items.category', 'Other'] },
          units: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: notCancelled },
      {
        $group: {
          _id: '$shippingAddress.county',
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$total', 0] } },
        },
      },
      { $sort: { orders: -1 } },
      { $limit: 10 },
    ]),
    User.countDocuments({ ...range, role: 'CUSTOMER' }),
    Order.countDocuments({ ...range, orderStatus: 'CANCELLED' }),
  ]);

  const s = summary[0] || { orders: 0, gross: 0, revenue: 0, paidOrders: 0, unpaid: 0, deliveryFees: 0, discounts: 0, items: 0, customers: 0 };

  // Fill in days with no sales so the chart has no gaps.
  let filled = series;
  if (groupBy === 'day') {
    const byDay = new Map(series.map((r) => [r._id, r]));
    filled = [];
    for (let d = from; d <= to; d = addDays(d, 1)) filled.push(byDay.get(d) || { _id: d, orders: 0, revenue: 0, gross: 0 });
  }

  res.json({
    success: true,
    from,
    to,
    groupBy,
    summary: {
      ...s,
      _id: undefined,
      averageOrder: s.paidOrders ? Math.round(s.revenue / s.paidOrders) : 0,
      cancelled,
      newCustomers,
    },
    series: filled.map((r) => ({ period: r._id, orders: r.orders, revenue: r.revenue, gross: r.gross })),
    byMethod: byMethod.map((r) => ({ method: r._id, orders: r.orders, revenue: r.revenue })),
    byStatus: Object.fromEntries(byStatus.map((r) => [r._id, { orders: r.orders, value: r.value }])),
    topProducts: topProducts.map((r) => ({ productId: r._id, name: r.name, image: r.image, units: r.units, revenue: r.revenue })),
    byCategory: byCategory.map((r) => ({ category: r._id || 'Other', units: r.units, revenue: r.revenue })),
    byCounty: byCounty.map((r) => ({ county: r._id, orders: r.orders, revenue: r.revenue })),
  });
});
