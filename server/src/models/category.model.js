import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },

    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },

    description: { type: String, trim: true, default: '' },

    // Picture used on the homepage "Shop by category" tiles.
    image: { url: { type: String, default: '' }, fileId: { type: String, default: '' } },

    // Product types offered in this category (used for filters and the product form).
    subCategories: { type: [String], default: [] },

    sortOrder: { type: Number, default: 0 },

    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
