import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Name shown on the review (copied so it stays if the account changes).
    name: { type: String, required: true, trim: true },

    rating: { type: Number, required: true, min: 1, max: 5 },

    title: { type: String, trim: true, default: '' },

    comment: { type: String, trim: true, default: '' },

    // True when the reviewer has a delivered order containing this product.
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One review per customer per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Recalculates the product's average rating and review count.
reviewSchema.statics.refreshProductRating = async function refreshProductRating(productId) {
  const [stats] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('Product').updateOne(
    { _id: productId },
    {
      ratingAverage: stats ? Math.round(stats.avg * 10) / 10 : 0,
      ratingCount: stats ? stats.count : 0,
    },
  );
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
