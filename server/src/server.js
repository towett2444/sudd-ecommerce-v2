import mongoose from 'mongoose';

import app from './app.js';
import './models/category.model.js';
import './models/order.model.js';
import './models/product.model.js';
import './models/review.model.js';
import './models/user.model.js';
import connectDB from './config/db.js';
import { ensureAdmin, migrateData, seedProductsIfEmpty } from './data/seedProducts.js';
import { mpesaConfigured } from './services/mpesa.js';
import { sweepUnpaidOrders } from './services/orders.js';
import { paystackConfigured } from './services/paystack.js';
import { usingImageKit } from './utils/images.js';

const port = process.env.PORT || 8000;

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];

const startServer = async () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}. See server/.env.example.`);
    process.exit(1);
  }

  try {
    // Connect to the database before accepting requests
    await connectDB();

    // Make sure unique indexes (product slugs, emails, order numbers) exist before writing anything
    await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));

    // Give a new store something to show, and update data from older versions
    await seedProductsIfEmpty();
    await migrateData();
    await ensureAdmin();

    // Cancel unpaid M-Pesa / card orders after a while so their stock goes back on sale
    setInterval(() => sweepUnpaidOrders().catch((e) => console.error('Unpaid order check failed:', e.message)), 10 * 60 * 1000).unref();
    sweepUnpaidOrders().catch(() => {});

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(
        `Payments: M-Pesa ${mpesaConfigured() ? `live (${process.env.MPESA_ENV || 'sandbox'})` : 'TEST MODE'}, ` +
          `card ${paystackConfigured() ? 'live (Paystack)' : 'TEST MODE'}, cash on delivery on. ` +
          `Images: ${usingImageKit() ? 'ImageKit' : 'saved on this server (server/uploads)'}`,
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
