import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Review from '../models/review.model.js';
import User from '../models/user.model.js';
import { ah } from '../utils/http.js';

const startOfNairobiDay = (daysAgo = 0) => {
  const today = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  return new Date(Date.parse(`${today}T00:00:00+03:00`) - daysAgo * 864e5);
};

// GET /dashboard/admin/overview
export const getAdminDashboard = ah(async (req, res) => {
  const today = startOfNairobiDay(0);
  const monthAgo = startOfNairobiDay(29);

  const [
    totalOrders, awaiting, totalProducts, activeProducts, totalCustomers, recentOrders,
    revenueAll, revenueToday, revenue30, lowStock, outOfStock, unpaidCod, newReviews,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: { $in: ['PENDING', 'PROCESSING'] } }),
    Product.countDocuments(),
    Product.countDocuments({ active: true }),
    User.countDocuments({ role: 'CUSTOMER' }),
    Order.find().sort({ createdAt: -1 }).limit(8)
      .select('orderNumber user shippingAddress total orderStatus paymentMethod paymentStatus createdAt')
      .populate('user', 'name email').lean(),
    Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'PAID', paidAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$total' }, n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'PAID', createdAt: { $gte: monthAgo } } }, { $group: { _id: null, total: { $sum: '$total' }, n: { $sum: 1 } } }]),
    Product.find({ active: true, $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] } })
      .select('name slug stock lowStockThreshold images').sort({ stock: 1 }).limit(8).lean(),
    Product.countDocuments({ active: true, stock: { $lte: 0 } }),
    Order.countDocuments({ paymentMethod: 'COD', paymentStatus: { $ne: 'PAID' }, orderStatus: { $ne: 'CANCELLED' } }),
    Review.countDocuments({ createdAt: { $gte: startOfNairobiDay(6) } }),
  ]);

  res.json({
    success: true,
    stats: {
      totalRevenue: revenueAll[0]?.total || 0,
      revenueToday: revenueToday[0]?.total || 0,
      ordersPaidToday: revenueToday[0]?.n || 0,
      revenue30: revenue30[0]?.total || 0,
      orders30: revenue30[0]?.n || 0,
      totalOrders,
      ordersAwaitingFulfillment: awaiting,
      totalProducts,
      availableProducts: activeProducts,
      totalCustomers,
      outOfStock,
      unpaidCod,
      newReviews,
    },
    recentOrders,
    lowStock,
  });
});
