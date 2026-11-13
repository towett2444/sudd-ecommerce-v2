import api from '../lib/api';

// register user
export const registerUser = async (formData) => {
  const { data } = await api.post('/auth/register', formData);

  return data;
};

// login user
export const loginUser = async (formData) => {
  const { data } = await api.post('/auth/login', formData);

  return data;
};

// logout user
export const logoutUser = async () => {
  const { data } = await api.post('/auth/logout');

  return data;
};

// get current user
export const getMe = async () => {
  const { data } = await api.get('/auth/me');

  return data;
};
