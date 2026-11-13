import Product from '../models/product.model.js';

// generate base slug
export const generateSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// generate unique product slug
export const generateUniqueProductSlug = async (
  name,
  excludeProductId = null,
) => {
  const baseSlug = generateSlug(name);

  let slug = baseSlug;
  let counter = 2;

  while (
    await Product.exists({
      slug,
      ...(excludeProductId && {
        _id: { $ne: excludeProductId },
      }),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};
