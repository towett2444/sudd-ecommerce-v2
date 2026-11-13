import mongoose from 'mongoose';

import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Review from '../models/review.model.js';
import { ah, escapeRegex, HttpError, paging, text } from '../utils/http.js';

const validId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid id.');
  return id;
};

// GET /reviews/product/:productId — public list plus rating breakdown.
export const getProductReviews = ah(async (req, res) => {
  const productId = validId(req.params.productId);
  const { page, limit, skip } = paging(req.query, 10, 50);
  const sorts = { newest: { createdAt: -1 }, highest: { rating: -1, createdAt: -1 }, lowest: { rating: 1, createdAt: -1 } };

  const [reviews, total, breakdown] = await Promise.all([
    Review.find({ product: productId }).sort(sorts[req.query.sort] || sorts.newest).skip(skip).limit(limit)
      .select('name rating title comment verifiedPurchase createdAt user'),
    Review.countDocuments({ product: productId }),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  breakdown.forEach((b) => { counts[b._id] = b.count; });

  res.json({ success: true, reviews, total, page, pages: Math.max(1, Math.ceil(total / limit)), breakdown: counts });
});

// GET /reviews/product/:productId/mine — the signed-in customer's review and whether they bought it.
export const getMyReview = ah(async (req, res) => {
  const productId = validId(req.params.productId);
  const [review, purchased] = await Promise.all([
    Review.findOne({ product: productId, user: req.user._id }),
    Order.exists({ user: req.user._id, 'items.product': productId, orderStatus: 'DELIVERED' }),
  ]);
  res.json({ success: true, review, purchased: Boolean(purchased) });
});

// POST /reviews/product/:productId — create or update the customer's review.
export const upsertReview = ah(async (req, res) => {
  const productId = validId(req.params.productId);
  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) throw new HttpError(404, 'Product not found.');

  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5 stars.');
  const title = text(req.body.title, 100);
  const comment = text(req.body.comment, 2000);
  if (comment.length > 0 && comment.length < 3) throw new HttpError(400, 'Your review is too short.');

  const verifiedPurchase = Boolean(
    await Order.exists({ user: req.user._id, 'items.product': productId, orderStatus: 'DELIVERED' }),
  );

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  const review = await Review.findOneAndUpdate(
    { product: productId, user: req.user._id },
    { rating, title, comment, verifiedPurchase, name: req.user.name.split(' ')[0] + (req.user.name.includes(' ') ? ` ${req.user.name.split(' ').slice(-1)[0][0]}.` : '') },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  await Review.refreshProductRating(productId);

  res.status(existing ? 200 : 201).json({ success: true, message: existing ? 'Review updated.' : 'Thanks for your review!', review });
});

// DELETE /reviews/:id — the author or an admin.
export const deleteReview = ah(async (req, res) => {
  const review = await Review.findById(validId(req.params.id));
  if (!review) throw new HttpError(404, 'Review not found.');
  if (req.user.role !== 'ADMIN' && !review.user.equals(req.user._id)) throw new HttpError(403, 'You can only delete your own review.');
  await review.deleteOne();
  await Review.refreshProductRating(review.product);
  res.json({ success: true, message: 'Review deleted.' });
});

// GET /reviews/admin — all reviews for moderation.
export const getReviewsAdmin = ah(async (req, res) => {
  const { page, limit, skip } = paging(req.query, 25, 100);
  const filter = {};
  if (req.query.rating) filter.rating = Number(req.query.rating);
  const q = text(req.query.q, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: re }, { title: re }, { comment: re }];
  }
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('product', 'name slug images').populate('user', 'email'),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, reviews, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});
