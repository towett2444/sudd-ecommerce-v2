import api from '../lib/api';

export const createOrder = async (orderData) => {
  const { data } = await api.post('/orders', orderData);

  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get('/orders');

  return data;
};

export const getOrderById = async (orderId) => {
  const { data } = await api.get(`/orders/${orderId}`);

  return data;
};

export const getAllOrders = async () => {
  const { data } = await api.get('/orders/admin/all');

  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const { data } = await api.patch(`/orders/admin/${orderId}/status`, {
    status,
  });

  return data;
};
