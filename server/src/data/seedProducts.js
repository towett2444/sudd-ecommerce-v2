import bcrypt from 'bcryptjs';

import Category from '../models/category.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import { generateSlug } from '../utils/generateSlug.js';
import sampleProducts from './sampleProducts.js';

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const DEFAULT_CATEGORIES = [
  {
    name: 'Men', description: 'Shirts, hoodies & jackets', image: unsplash('1488161628813-04466f872be2'),
    subCategories: ['T-Shirts', 'Shirts', 'Hoodies', 'Jackets', 'Trousers'],
  },
  {
    name: 'Women', description: 'Dresses, tops & layers', image: unsplash('1485968579580-b6d095142e6e'),
    subCategories: ['Dresses', 'Tops', 'Jackets', 'Trousers'],
  },
  {
    name: 'Shoes', description: 'Sneakers & running shoes', image: unsplash('1549298916-b41d501d3772'),
    subCategories: ['Sneakers', 'Running Shoes', 'Formal Shoes', 'Heels'],
  },
  {
    name: 'Accessories', description: 'Bags, watches & sunglasses', image: unsplash('1511499767150-a48a237f0083'),
    subCategories: ['Bags', 'Watches', 'Sunglasses', 'Jewellery', 'Caps'],
  },
];

// Fill an empty store with the starter catalogue.
// Runs on startup outside production unless SEED_SAMPLE_PRODUCTS=false.
export const seedProductsIfEmpty = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.SEED_SAMPLE_PRODUCTS === 'false') return;
  // countDocuments, not estimatedDocumentCount: the estimate can be stale after the database was stopped abruptly.
  if ((await Product.countDocuments()) > 0) return;

  await Product.insertMany(sampleProducts.map((p) => ({ ...p, slug: generateSlug(p.name) })));
  console.log(`Added ${sampleProducts.length} sample products to the empty store`);
};

// Brings data from older versions of the store up to date. Safe to run on every start.
export const migrateData = async () => {
  // 1. Categories: create the defaults and any category that products already use.
  const firstRun = (await Category.countDocuments()) === 0;
  const used = await Product.distinct('category');
  const names = [...new Set([...(firstRun ? DEFAULT_CATEGORIES.map((c) => c.name) : []), ...used])];
  let created = 0;
  for (const [i, name] of names.entries()) {
    if (await Category.exists({ name })) continue;
    const preset = DEFAULT_CATEGORIES.find((c) => c.name === name);
    const subs = await Product.distinct('subCategory', { category: name });
    let slug = generateSlug(name) || `category-${i + 1}`;
    while (await Category.exists({ slug })) slug += '-2';
    await Category.create({
      name,
      slug,
      description: preset?.description || '',
      image: { url: preset?.image || '', fileId: '' },
      subCategories: [...new Set([...(preset?.subCategories || []), ...subs])],
      sortOrder: i,
    });
    created++;
  }
  if (created) console.log(`Created ${created} categories`);

  // 2. Products from the old version had no stock count: give in-stock items 20 units.
  const noStock = await Product.updateMany(
    { stock: { $exists: false } },
    [{ $set: { stock: { $cond: [{ $eq: ['$inStock', false] }, 0, 20] }, active: true, featured: { $ifNull: ['$featured', false] } } }],
    { updatePipeline: true },
  );
  if (noStock.modifiedCount) console.log(`Set stock levels for ${noStock.modifiedCount} older products (20 each — update them in the admin)`);
  await Product.updateMany({ active: { $exists: false } }, { active: true });
  await Product.updateMany({}, [{ $set: { inStock: { $gt: ['$stock', 0] } } }], { updatePipeline: true });

  // 3. Older orders: give them an order number and a status history.
  const oldOrders = await Order.find({ orderNumber: { $exists: false } }).limit(5000);
  for (const order of oldOrders) {
    order.orderNumber = await Order.newOrderNumber();
    if (!order.statusHistory?.length) order.statusHistory = [{ status: order.orderStatus, note: 'Imported from the previous version.', at: order.updatedAt }];
    order.stockRestored = true; // older orders never reserved stock
    await order.save({ validateBeforeSave: false });
  }
  if (oldOrders.length) console.log(`Updated ${oldOrders.length} older orders`);

  // 4. Ratings
  await Product.updateMany({ ratingCount: { $exists: false } }, { ratingAverage: 0, ratingCount: 0 });
};

// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD in server/.env (only if that email has no account yet).
export const ensureAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (await User.exists({ email })) return;
  if (password.length < 8) {
    console.warn('ADMIN_PASSWORD must be at least 8 characters; admin account not created.');
    return;
  }
  await User.create({
    name: process.env.ADMIN_NAME || 'Store Admin',
    email,
    password: await bcrypt.hash(password, 12),
    role: 'ADMIN',
  });
  console.log(`Created admin account ${email} (password is ADMIN_PASSWORD in server/.env)`);
};
