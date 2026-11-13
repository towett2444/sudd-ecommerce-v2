import { Router } from 'express';

import {
  checkCart,
  createProduct,
  deleteProductByAdmin,
  getFacets,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsByAdmin,
  updateProductByAdmin,
  updateStock,
} from '../controllers/product.controller.js';
import { adminOnly } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const productRouter = Router();

// admin routes (before /:slug so "admin" isn't read as a slug)
productRouter.get('/admin/products', ...adminOnly, getProductsByAdmin);
productRouter.get('/admin/products/:id', ...adminOnly, getProductById);
productRouter.post('/admin/products', ...adminOnly, upload.array('images', 4), createProduct);
productRouter.patch('/admin/products/:id', ...adminOnly, upload.array('images', 4), updateProductByAdmin);
productRouter.patch('/admin/products/:id/stock', ...adminOnly, updateStock);
productRouter.delete('/admin/products/:id', ...adminOnly, deleteProductByAdmin);

// public routes
productRouter.get('/', getProducts);
productRouter.get('/facets', getFacets);
productRouter.post('/cart-check', checkCart);
productRouter.get('/:slug', getProductBySlug);

export default productRouter;
