import mongoose from 'mongoose';

import { DEFAULT_LOW_STOCK } from '../config/store.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    sku: { type: String, trim: true, default: '' },

    description: { type: String, required: true, trim: true },

    // Selling price. If compareAtPrice is higher, the product shows as on sale.
    price: { type: Number, required: true, min: 0 },

    compareAtPrice: { type: Number, min: 0, default: null },

    // Name of a Category document (kept as text so old orders and links keep working).
    category: { type: String, required: true, trim: true, index: true },

    subCategory: { type: String, required: true, trim: true },

    sizes: { type: [String], default: [] },

    colors: { type: [String], default: [] },

    images: [
      {
        _id: false,
        url: { type: String, required: true, trim: true },
        fileId: { type: String, required: true, trim: true },
      },
    ],

    bestseller: { type: Boolean, default: false },

    // Shown in the "Featured" section of the homepage.
    featured: { type: Boolean, default: false },

    // Hidden from the store when false (draft / discontinued).
    active: { type: Boolean, default: true, index: true },

    // Units available to sell. inStock is kept in sync automatically (stock > 0).
    stock: { type: Number, min: 0, default: 0 },

    lowStockThreshold: { type: Number, min: 0, default: DEFAULT_LOW_STOCK },

    inStock: { type: Boolean, default: false },

    soldCount: { type: Number, default: 0 },

    ratingAverage: { type: Number, default: 0 },

    ratingCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.virtual('onSale').get(function onSale() {
  return this.compareAtPrice != null && this.compareAtPrice > this.price;
});

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.compareAtPrice || !(this.compareAtPrice > this.price)) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

productSchema.virtual('lowStock').get(function lowStock() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

productSchema.pre('save', function syncInStock() {
  this.inStock = this.stock > 0;
});

productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

// Re-computes inStock after stock was changed with $inc.
productSchema.statics.syncInStock = function syncInStock(ids) {
  return this.updateMany({ _id: { $in: ids } }, [{ $set: { inStock: { $gt: ['$stock', 0] } } }], { updatePipeline: true });
};

const Product = mongoose.model('Product', productSchema);

export default Product;
