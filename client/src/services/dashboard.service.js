import api from '../lib/api';

// get admin dashboard overview
export const getAdminDashboard = async () => {
  const { data } = await api.get('/dashboard/admin/overview');

  return data;
};
