import api from '../lib/api';

// get products (params: q, category, sort, limit, onSale, featured, bestseller, ...)
export const getProducts = async (params) => {
  const { data } = await api.get('/products', { params });

  return data;
};

// get product by slug
export const getProductBySlug = async (slug) => {
  const { data } = await api.get(`/products/${slug}`);

  return data;
};

// get all products by admin
export const getProductsByAdmin = async () => {
  const { data } = await api.get('/products/admin/products');

  return data;
};

// get product by id
export const getProductById = async (id) => {
  const { data } = await api.get(`/products/admin/products/${id}`);

  return data;
};

// create product
export const createProductByAdmin = async (formData) => {
  const { data } = await api.post('/products/admin/products', formData);

  return data;
};

// update product
export const updateProductByAdmin = async (id, formData) => {
  const { data } = await api.patch(`/products/admin/products/${id}`, formData);

  return data;
};

// delete product
export const deleteProductByAdmin = async (id) => {
  const { data } = await api.delete(`/products/admin/products/${id}`);

  return data;
};
