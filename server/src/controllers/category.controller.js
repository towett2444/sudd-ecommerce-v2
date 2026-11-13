import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import { generateSlug } from '../utils/generateSlug.js';
import { ah, escapeRegex, HttpError, text } from '../utils/http.js';
import { deleteImages, ImageError, uploadImages } from '../utils/images.js';

const parseList = (value) => {
  if (value === undefined || value === null || value === '') return [];
  let list = value;
  if (!Array.isArray(list)) {
    try { list = JSON.parse(value); } catch { list = String(value).split(','); }
  }
  return [...new Set(list.map((v) => String(v).trim()).filter(Boolean))].slice(0, 50);
};

const withCounts = async (categories, activeOnly) => {
  const counts = await Product.aggregate([
    { $match: activeOnly ? { active: true } : {} },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const byName = new Map(counts.map((c) => [c._id, c.count]));
  return categories.map((c) => ({ ...c, productCount: byName.get(c.name) || 0 }));
};

// public: active categories with product counts
export const getCategories = ah(async (req, res) => {
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ success: true, categories: await withCounts(categories, true) });
});

// admin: all categories
export const getCategoriesAdmin = ah(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ success: true, categories: await withCounts(categories, false) });
});

const uniqueSlug = async (name, excludeId) => {
  const base = generateSlug(name) || 'category';
  let slug = base;
  for (let i = 2; await Category.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }); i++) slug = `${base}-${i}`;
  return slug;
};

export const createCategory = ah(async (req, res) => {
  const name = text(req.body.name, 50);
  if (!name) throw new HttpError(400, 'Category name is required.');
  if (await Category.exists({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })) {
    throw new HttpError(409, 'A category with this name already exists.');
  }

  const uploaded = [];
  try {
    if (req.file) await uploadImages([req.file], uploaded, 'categories');
    const category = await Category.create({
      name,
      slug: await uniqueSlug(name),
      description: text(req.body.description, 300),
      subCategories: parseList(req.body.subCategories),
      sortOrder: Number(req.body.sortOrder) || 0,
      active: req.body.active === undefined ? true : String(req.body.active) === 'true',
      image: uploaded[0] || { url: text(req.body.imageUrl, 500), fileId: '' },
    });
    res.status(201).json({ success: true, message: 'Category created.', category });
  } catch (error) {
    await deleteImages(uploaded);
    if (error instanceof ImageError) throw new HttpError(400, error.message);
    throw error;
  }
});

// Renaming a category also renames it on its products.
export const updateCategory = ah(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found.');
  const oldName = category.name;
  const oldImage = category.image?.fileId ? { url: category.image.url, fileId: category.image.fileId } : null;

  if (req.body.name !== undefined) {
    const name = text(req.body.name, 50);
    if (!name) throw new HttpError(400, 'Category name is required.');
    if (name.toLowerCase() !== oldName.toLowerCase() &&
      (await Category.exists({ _id: { $ne: category._id }, name: new RegExp(`^${escapeRegex(name)}$`, 'i') }))) {
      throw new HttpError(409, 'A category with this name already exists.');
    }
    if (name !== oldName) {
      category.name = name;
      category.slug = await uniqueSlug(name, category._id);
    }
  }
  if (req.body.description !== undefined) category.description = text(req.body.description, 300);
  if (req.body.subCategories !== undefined) category.subCategories = parseList(req.body.subCategories);
  if (req.body.sortOrder !== undefined) category.sortOrder = Number(req.body.sortOrder) || 0;
  if (req.body.active !== undefined) category.active = String(req.body.active) === 'true';

  const uploaded = [];
  try {
    if (req.file) {
      await uploadImages([req.file], uploaded, 'categories');
      category.image = uploaded[0];
    } else if (req.body.imageUrl !== undefined) {
      category.image = { url: text(req.body.imageUrl, 500), fileId: '' };
    }
    await category.save();
  } catch (error) {
    await deleteImages(uploaded);
    if (error instanceof ImageError) throw new HttpError(400, error.message);
    throw error;
  }

  if (category.name !== oldName) {
    await Product.updateMany({ category: oldName }, { category: category.name });
  }
  if (oldImage && oldImage.fileId !== category.image?.fileId) await deleteImages([oldImage]);

  res.json({ success: true, message: 'Category updated.', category });
});

export const deleteCategory = ah(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found.');
  const used = await Product.countDocuments({ category: category.name });
  if (used) {
    throw new HttpError(400, `${used} product${used === 1 ? ' is' : 's are'} in this category. Move or delete them first, or hide the category instead.`);
  }
  await category.deleteOne();
  await deleteImages([category.image]);
  res.json({ success: true, message: 'Category deleted.' });
});
