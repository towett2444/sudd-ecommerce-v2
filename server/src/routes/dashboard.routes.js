import express from 'express';

import { getCategories, getCategoriesAdmin, createCategory, deleteCategory, updateCategory } from '../controllers/category.controller.js';
import { deleteCustomer, getCustomer, listCustomers, updateCustomer } from '../controllers/customer.controller.js';
import { getAdminDashboard } from '../controllers/dashboard.controller.js';
import {
  mpesaCallback,
  paymentOptions,
  paymentStatus,
  paystackWebhook,
  startCard,
  startMpesa,
  testResult,
} from '../controllers/payment.controller.js';
import { salesReport } from '../controllers/report.controller.js';
import {
  deleteReview,
  getMyReview,
  getProductReviews,
  getReviewsAdmin,
  upsertReview,
} from '../controllers/review.controller.js';
import { DELIVERY_ZONES, FREE_DELIVERY_OVER, KENYA_COUNTIES, deliveryQuote } from '../config/store.js';
import { adminOnly, protect } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';

// ---------- admin dashboard, customers, reports ----------
export const dashboardRouter = express.Router();
dashboardRouter.get('/admin/overview', ...adminOnly, getAdminDashboard);
dashboardRouter.get('/admin/reports/sales', ...adminOnly, salesReport);
dashboardRouter.get('/admin/customers', ...adminOnly, listCustomers);
dashboardRouter.get('/admin/customers/:id', ...adminOnly, getCustomer);
dashboardRouter.patch('/admin/customers/:id', ...adminOnly, updateCustomer);
dashboardRouter.delete('/admin/customers/:id', ...adminOnly, deleteCustomer);

// ---------- categories ----------
export const categoryRouter = express.Router();
categoryRouter.get('/', getCategories);
categoryRouter.get('/admin', ...adminOnly, getCategoriesAdmin);
categoryRouter.post('/admin', ...adminOnly, upload.single('image'), createCategory);
categoryRouter.patch('/admin/:id', ...adminOnly, upload.single('image'), updateCategory);
categoryRouter.delete('/admin/:id', ...adminOnly, deleteCategory);

// ---------- reviews ----------
export const reviewRouter = express.Router();
reviewRouter.get('/admin', ...adminOnly, getReviewsAdmin);
reviewRouter.get('/product/:productId', getProductReviews);
reviewRouter.get('/product/:productId/mine', protect, getMyReview);
reviewRouter.post('/product/:productId', protect, rateLimit({ windowMs: 60 * 60 * 1000, max: 30, message: 'Too many reviews. Please try later.' }), upsertReview);
reviewRouter.delete('/:id', protect, deleteReview);

// ---------- payments ----------
export const paymentRouter = express.Router();
const payLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 15, message: 'Too many payment attempts. Please wait a few minutes.' });
paymentRouter.get('/options', paymentOptions);
paymentRouter.post('/mpesa/callback', mpesaCallback);
paymentRouter.post('/paystack/webhook', paystackWebhook);
paymentRouter.post('/:orderId/mpesa', protect, payLimit, startMpesa);
paymentRouter.post('/:orderId/card', protect, payLimit, startCard);
paymentRouter.get('/:orderId/status', protect, paymentStatus);
paymentRouter.post('/:orderId/test-result', protect, testResult);

// ---------- store info used by checkout ----------
export const storeRouter = express.Router();
storeRouter.get('/config', (req, res) => {
  res.json({ success: true, counties: KENYA_COUNTIES, deliveryZones: DELIVERY_ZONES, freeDeliveryOver: FREE_DELIVERY_OVER });
});
storeRouter.get('/delivery-quote', (req, res) => {
  const subtotal = Number(req.query.subtotal) || 0;
  res.json({ success: true, ...deliveryQuote(String(req.query.county || ''), subtotal) });
});

export default dashboardRouter;
