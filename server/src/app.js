import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import multer from 'multer';

import authRouter from './routes/auth.routes.js';
import productRouter from './routes/product.routes.js';
import orderRouter from './routes/order.routes.js';
import {
  categoryRouter,
  dashboardRouter,
  paymentRouter,
  reviewRouter,
  storeRouter,
} from './routes/dashboard.routes.js';
import { HttpError } from './utils/http.js';
import { UPLOAD_DIR } from './utils/images.js';

const app = express();

// Behind a proxy (e.g. Render, Nginx) this makes req.ip the visitor's address for rate limits.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

app.disable('x-powered-by');
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(
  cors({
    // A wildcard origin does not work with cookies, so always send a real origin.
    // In development any localhost port is allowed, in case 5173 is busy.
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((url) => url.trim());
      const isLocalDev =
        process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
      callback(null, !origin || allowed.includes(origin) || isLocalDev);
    },
    credentials: true,
  }),
);

// Paystack webhooks are verified against the exact bytes received, so keep the raw body for that route.
app.use('/api/v1/payments/paystack/webhook', express.raw({ type: '*/*', limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Express 5 leaves req.body undefined when no body is sent.
app.use((req, _res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Product and category pictures saved on this server (when ImageKit isn't configured)
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    dotfiles: 'deny',
    index: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);

// api endpoints
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/store', storeRouter);

app.get('/test', (req, res) => res.status(200).json({ success: true, message: 'API running...' }));

// unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// error handler (our HttpErrors, multer upload errors, malformed JSON, etc.)
// Express needs all four arguments to treat this as an error handler.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Each image must be 5MB or smaller.',
      LIMIT_FILE_COUNT: 'A maximum of 4 product images is allowed.',
      LIMIT_UNEXPECTED_FILE: 'A maximum of 4 product images is allowed.',
    };
    return res.status(400).json({ success: false, message: messages[error.code] || error.message });
  }

  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });
  }

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'The request is too large.' });
  }

  if (error?.isUploadValidationError) {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message || 'Invalid data.' });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ success: false, message: 'That already exists.' });
  }

  console.error('Unhandled error:', error);
  return res.status(500).json({ success: false, message: 'Something went wrong.' });
});

export default app;
