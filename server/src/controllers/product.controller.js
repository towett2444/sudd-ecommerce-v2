import mongoose from 'mongoose';

import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import Review from '../models/review.model.js';
import { generateUniqueProductSlug } from '../utils/generateSlug.js';
import { ah, escapeRegex, HttpError, paging, text, toInt } from '../utils/http.js';
import { deleteImages, ImageError, uploadImages } from '../utils/images.js';

const MAX_IMAGES = 4;

// parse a JSON array of strings sent through multipart/form-data
const parseStringArray = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return [];
  let parsed = value;
  if (!Array.isArray(value)) {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new HttpError(400, `Invalid ${fieldName} format.`);
    }
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new HttpError(400, `Invalid ${fieldName} format.`);
  }
  return [...new Set(parsed.map((item) => item.trim()))];
};

const parseBoolean = (value) => (typeof value === 'boolean' ? value : value === 'true');

const parseMoney = (value, label, { allowEmpty = false } = {}) => {
  if (allowEmpty && (value === '' || value === null || value === undefined || value === 'null')) return null;
  const n = Number(value);
  if (value === '' || value === undefined || !Number.isFinite(n) || n < 0) {
    throw new HttpError(400, `${label} must be a valid amount.`);
  }
  return Math.round(n * 100) / 100;
};

const parseWhole = (value, label) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new HttpError(400, `${label} must be a whole number of 0 or more.`);
  return n;
};

const checkCategory = async (name) => {
  if (!name || !(await Category.exists({ name }))) {
    throw new HttpError(400, 'Choose a category from the list (manage them under Categories).');
  }
};

const PUBLIC_SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1, createdAt: -1 },
  'price-desc': { price: -1, createdAt: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  popular: { soldCount: -1, createdAt: -1 },
  name: { name: 1 },
};

// Builds the MongoDB filter for the store's product search.
const publicFilter = (q) => {
  const filter = { active: true };
  const and = [];

  const search = text(q.q, 100);
  if (search) {
    const words = search.split(/\s+/).slice(0, 6).map((w) => new RegExp(escapeRegex(w), 'i'));
    for (const re of words) {
      and.push({ $or: [{ name: re }, { description: re }, { category: re }, { subCategory: re }, { colors: re }, { sku: re }] });
    }
  }

  const list = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);
  const categories = list(q.category);
  const subCategories = list(q.subCategory);
  if (categories.length) filter.category = { $in: categories };
  if (subCategories.length) filter.subCategory = { $in: subCategories };
  const sizes = list(q.size);
  if (sizes.length) filter.sizes = { $in: sizes };

  const min = Number(q.minPrice);
  const max = Number(q.maxPrice);
  if (q.minPrice !== undefined && q.minPrice !== '' && Number.isFinite(min)) filter.price = { ...filter.price, $gte: min };
  if (q.maxPrice !== undefined && q.maxPrice !== '' && Number.isFinite(max)) filter.price = { ...filter.price, $lte: max };

  if (q.inStock === 'true') filter.stock = { $gt: 0 };
  if (q.onSale === 'true') and.push({ $expr: { $gt: ['$compareAtPrice', '$price'] } });
  if (q.featured === 'true') filter.featured = true;
  if (q.bestseller === 'true') filter.bestseller = true;
  const minRating = Number(q.minRating);
  if (Number.isFinite(minRating) && minRating > 0) filter.ratingAverage = { $gte: minRating };

  if (and.length) filter.$and = and;
  return filter;
};

// GET /products — public search with filters, sorting and pages.
// Query: q, category, subCategory, size, minPrice, maxPrice, inStock, onSale, featured, bestseller, minRating, sort, page, limit
export const getProducts = ah(async (req, res) => {
  const { page, limit, skip } = paging(req.query, 24, 100);
  const filter = publicFilter(req.query);
  const sort = PUBLIC_SORTS[req.query.sort] || PUBLIC_SORTS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// GET /products/facets — the options shown in the shop filters.
export const getFacets = ah(async (req, res) => {
  const [facet] = await Product.aggregate([
    { $match: { active: true } },
    {
      $facet: {
        price: [{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
        subCategories: [{ $group: { _id: '$subCategory', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        sizes: [{ $unwind: '$sizes' }, { $group: { _id: '$sizes', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        onSale: [{ $match: { $expr: { $gt: ['$compareAtPrice', '$price'] } } }, { $count: 'n' }],
      },
    },
  ]);
  res.json({
    success: true,
    price: facet.price[0] ? { min: facet.price[0].min, max: facet.price[0].max } : { min: 0, max: 0 },
    subCategories: facet.subCategories.map((s) => ({ name: s._id, count: s.count })),
    sizes: facet.sizes.map((s) => ({ name: s._id, count: s.count })),
    onSaleCount: facet.onSale[0]?.n || 0,
  });
});

// GET /products/:slug — product page (with related products).
export const getProductBySlug = ah(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true });
  if (!product) throw new HttpError(404, 'Product not found.');

  const related = await Product.find({
    _id: { $ne: product._id },
    active: true,
    $or: [{ subCategory: product.subCategory }, { category: product.category }],
  })
    .sort({ subCategory: product.subCategory ? -1 : 1, soldCount: -1 })
    .limit(8);

  res.json({ success: true, product, related });
});

// POST /products/cart-check — current price and stock for the items in a cart.
export const checkCart = ah(async (req, res) => {
  const ids = (Array.isArray(req.body.productIds) ? req.body.productIds : [])
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .slice(0, 100);
  const products = await Product.find({ _id: { $in: ids } }).select('name slug price compareAtPrice stock active images');
  res.json({
    success: true,
    products: products.map((p) => ({
      productId: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.active ? p.stock : 0,
      available: p.active && p.stock > 0,
      image: p.images?.[0]?.url || '',
    })),
  });
});

// ---------- admin ----------

// GET /products/admin/products — all products, with search, filters and stock view.
export const getProductsByAdmin = ah(async (req, res) => {
  const filter = {};
  const search = text(req.query.q, 100);
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { sku: re }, { subCategory: re }];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.stock === 'out') filter.stock = 0;
  if (req.query.stock === 'low') filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  if (req.query.status === 'active') filter.active = true;
  if (req.query.status === 'hidden') filter.active = false;

  const sorts = { newest: { createdAt: -1 }, name: { name: 1 }, 'stock-asc': { stock: 1 }, 'stock-desc': { stock: -1 }, sold: { soldCount: -1 } };
  const products = await Product.find(filter).sort(sorts[req.query.sort] || sorts.newest);

  const [counts] = await Product.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        out: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
        low: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] }, 1, 0] } },
        units: { $sum: '$stock' },
        value: { $sum: { $multiply: ['$stock', '$price'] } },
      },
    },
  ]);

  res.json({ success: true, products, summary: counts || { total: 0, out: 0, low: 0, units: 0, value: 0 } });
});

export const getProductById = ah(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid product id.');
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ success: true, product });
});

// Applies form fields to a product document. `creating` makes the required fields mandatory.
const applyFields = async (product, body, creating) => {
  const has = (k) => body[k] !== undefined;

  if (creating || has('name')) {
    const name = text(body.name, 120);
    if (!name) throw new HttpError(400, 'Product name is required.');
    if (name !== product.name) {
      product.name = name;
      product.slug = await generateUniqueProductSlug(name, product._id);
    }
  }
  if (creating || has('description')) {
    const description = text(body.description, 5000);
    if (!description) throw new HttpError(400, 'Description is required.');
    product.description = description;
  }
  if (creating || has('subCategory')) {
    const sub = text(body.subCategory, 60);
    if (!sub) throw new HttpError(400, 'Product type is required.');
    product.subCategory = sub;
  }
  if (creating || has('category')) {
    const category = text(body.category, 50);
    await checkCategory(category);
    product.category = category;
  }
  if (creating || has('price')) product.price = parseMoney(body.price, 'Price');
  if (has('compareAtPrice')) product.compareAtPrice = parseMoney(body.compareAtPrice, 'Original price', { allowEmpty: true });
  if (product.compareAtPrice != null && product.compareAtPrice <= product.price) {
    throw new HttpError(400, 'The original price must be higher than the selling price (or leave it empty for no discount).');
  }
  if (creating || has('stock')) product.stock = parseWhole(body.stock ?? 0, 'Stock');
  if (has('lowStockThreshold')) product.lowStockThreshold = parseWhole(body.lowStockThreshold, 'Low-stock alert level');
  if (has('sku')) product.sku = text(body.sku, 40);
  if (has('sizes')) product.sizes = parseStringArray(body.sizes, 'sizes');
  if (has('colors')) product.colors = parseStringArray(body.colors, 'colors');
  if (has('bestseller')) product.bestseller = parseBoolean(body.bestseller);
  if (has('featured')) product.featured = parseBoolean(body.featured);
  // `inStock` was the old "show in store" switch; it now maps to `active`.
  if (has('active')) product.active = parseBoolean(body.active);
  else if (has('inStock') && creating) product.active = parseBoolean(body.inStock);
};

export const createProduct = ah(async (req, res) => {
  const uploaded = [];
  try {
    const product = new Product({});
    await applyFields(product, req.body, true);

    if (!req.files?.length) throw new HttpError(400, 'At least one product image is required.');
    if (req.files.length > MAX_IMAGES) throw new HttpError(400, 'A maximum of 4 product images is allowed.');

    await uploadImages(req.files, uploaded);
    product.images = uploaded;
    await product.save();

    res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (error) {
    await deleteImages(uploaded, 'Image cleanup error');
    if (error instanceof ImageError) throw new HttpError(400, error.message);
    throw error;
  }
});

export const updateProductByAdmin = ah(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid product id.');
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');

  const uploaded = [];
  try {
    await applyFields(product, req.body, false);

    const files = req.files || [];
    const oldImages = product.images.map((i) => ({ url: i.url, fileId: i.fileId }));
    let finalImages = oldImages;

    if (req.body.imageSlots !== undefined) {
      // imageSlots lists every image the product should end up with, in order:
      // { fileId } keeps an existing image, "new" takes the next uploaded file.
      let slots;
      try {
        slots = JSON.parse(req.body.imageSlots);
      } catch {
        throw new HttpError(400, 'Invalid image data.');
      }
      if (!Array.isArray(slots) || slots.length === 0) throw new HttpError(400, 'At least one product image is required.');
      if (slots.length > MAX_IMAGES) throw new HttpError(400, 'A maximum of 4 product images is allowed.');
      if (slots.filter((s) => s === 'new').length !== files.length) throw new HttpError(400, 'Uploaded images do not match image data.');

      const existing = new Map(oldImages.map((i) => [i.fileId, i]));
      if (slots.some((s) => s !== 'new' && !existing.has(s?.fileId))) throw new HttpError(400, 'Invalid image data.');

      await uploadImages(files, uploaded);
      let next = 0;
      finalImages = slots.map((s) => (s === 'new' ? uploaded[next++] : existing.get(s.fileId)));
    } else if (files.length) {
      if (files.length > MAX_IMAGES) throw new HttpError(400, 'A maximum of 4 product images is allowed.');
      await uploadImages(files, uploaded);
      finalImages = [...uploaded];
    }

    product.images = finalImages;
    await product.save();

    const kept = new Set(finalImages.map((i) => i.fileId));
    await deleteImages(oldImages.filter((i) => !kept.has(i.fileId)), 'Failed to delete old image');

    res.json({ success: true, message: 'Product updated successfully.', product });
  } catch (error) {
    await deleteImages(uploaded, 'Failed to clean up image');
    if (error instanceof ImageError) throw new HttpError(400, error.message);
    throw error;
  }
});

// PATCH /products/admin/products/:id/stock — { stock } sets the level, { change } adds/removes units.
export const updateStock = ah(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid product id.');

  let product;
  if (req.body.change !== undefined) {
    const change = toInt(req.body.change, NaN);
    if (!Number.isInteger(change) || change === 0) throw new HttpError(400, 'Change must be a whole number other than 0.');
    product = await Product.findOneAndUpdate(
      { _id: req.params.id, ...(change < 0 && { stock: { $gte: -change } }) },
      { $inc: { stock: change } },
      { returnDocument: 'after' },
    );
    if (!product) {
      const exists = await Product.exists({ _id: req.params.id });
      throw new HttpError(exists ? 400 : 404, exists ? 'Stock cannot go below 0.' : 'Product not found.');
    }
  } else {
    const stock = parseWhole(req.body.stock, 'Stock');
    product = await Product.findByIdAndUpdate(req.params.id, { stock }, { returnDocument: 'after' });
    if (!product) throw new HttpError(404, 'Product not found.');
  }

  await Product.syncInStock([product._id]);
  product.inStock = product.stock > 0;
  res.json({ success: true, message: `Stock for ${product.name} is now ${product.stock}.`, product });
});

// Products that appear on orders are hidden instead of deleted, so order history keeps working.
export const deleteProductByAdmin = ah(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid product id.');
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');

  const Order = mongoose.model('Order');
  if (await Order.exists({ 'items.product': product._id })) {
    product.active = false;
    await product.save();
    return res.json({ success: true, archived: true, message: 'This product is on past orders, so it was hidden from the store instead of deleted.' });
  }

  const images = [...product.images];
  await product.deleteOne();
  await Review.deleteMany({ product: product._id });
  await deleteImages(images, 'Failed to delete image');
  res.json({ success: true, message: 'Product deleted successfully.' });
});
