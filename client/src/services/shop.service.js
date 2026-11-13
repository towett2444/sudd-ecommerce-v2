// API calls added in version 2: categories, reviews, payments, account, store settings and admin tools.
import api from '../lib/api';

const get = async (url, params) => (await api.get(url, { params })).data;
const post = async (url, body) => (await api.post(url, body)).data;
const patch = async (url, body) => (await api.patch(url, body)).data;
const del = async (url) => (await api.delete(url)).data;

// store
export const getStoreConfig = () => get('/store/config');
export const getPaymentOptions = () => get('/payments/options');
export const getCategories = () => get('/categories');
export const getFacets = () => get('/products/facets');
export const searchProducts = (params) => get('/products', params);
export const checkCart = (productIds) => post('/products/cart-check', { productIds });

// reviews
export const getReviews = (productId, params) => get(`/reviews/product/${productId}`, params);
export const getMyReview = (productId) => get(`/reviews/product/${productId}/mine`);
export const saveReview = (productId, body) => post(`/reviews/product/${productId}`, body);
export const deleteReview = (id) => del(`/reviews/${id}`);

// orders & payments
export const cancelOrder = (orderId, reason) => post(`/orders/${orderId}/cancel`, { reason });
export const startMpesa = (orderId, phone) => post(`/payments/${orderId}/mpesa`, { phone });
export const startCard = (orderId) => post(`/payments/${orderId}/card`);
export const getPaymentStatus = (orderId) => get(`/payments/${orderId}/status`);
export const sendTestResult = (orderId, result) => post(`/payments/${orderId}/test-result`, { result });

// account
export const updateProfile = (body) => patch('/auth/me', body);
export const changePassword = (body) => patch('/auth/me/password', body);
export const getAddresses = () => get('/auth/me/addresses');
export const addAddress = (body) => post('/auth/me/addresses', body);
export const updateAddress = (id, body) => patch(`/auth/me/addresses/${id}`, body);
export const setDefaultAddress = (id) => post(`/auth/me/addresses/${id}/default`);
export const deleteAddress = (id) => del(`/auth/me/addresses/${id}`);

// admin
export const adminProducts = (params) => get('/products/admin/products', params);
export const adminUpdateStock = (id, body) => patch(`/products/admin/products/${id}/stock`, body);
export const adminCategories = () => get('/categories/admin');
export const adminCreateCategory = (form) => post('/categories/admin', form);
export const adminUpdateCategory = (id, form) => patch(`/categories/admin/${id}`, form);
export const adminDeleteCategory = (id) => del(`/categories/admin/${id}`);
export const adminOrders = (params) => get('/orders/admin/all', params);
export const adminOrder = (id) => get(`/orders/admin/${id}`);
export const adminOrderStatus = (id, body) => patch(`/orders/admin/${id}/status`, body);
export const adminPaymentStatus = (id, body) => patch(`/orders/admin/${id}/payment`, body);
export const adminCustomers = (params) => get('/dashboard/admin/customers', params);
export const adminCustomer = (id) => get(`/dashboard/admin/customers/${id}`);
export const adminUpdateCustomer = (id, body) => patch(`/dashboard/admin/customers/${id}`, body);
export const adminDeleteCustomer = (id) => del(`/dashboard/admin/customers/${id}`);
export const adminReviews = (params) => get('/reviews/admin', params);
export const adminSalesReport = (params) => get('/dashboard/admin/reports/sales', params);
