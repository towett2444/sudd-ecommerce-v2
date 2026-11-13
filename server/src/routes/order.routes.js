import { Router } from 'express';

import {
  cancelMyOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from '../controllers/order.controller.js';
import { adminOnly, protect } from '../middlewares/auth.middleware.js';

const orderRouter = Router();

// Admin routes
orderRouter.get('/admin/all', ...adminOnly, getAllOrders);
orderRouter.get('/admin/:orderId', ...adminOnly, getOrderById);
orderRouter.patch('/admin/:orderId/status', ...adminOnly, updateOrderStatus);
orderRouter.patch('/admin/:orderId/payment', ...adminOnly, updatePaymentStatus);

// Customer routes
orderRouter.post('/', protect, createOrder);
orderRouter.get('/', protect, getMyOrders);
orderRouter.get('/:orderId', protect, getOrderById);
orderRouter.post('/:orderId/cancel', protect, cancelMyOrder);

export default orderRouter;
