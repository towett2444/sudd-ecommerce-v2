import axios from 'axios';

const api = axios.create({
  // Falls back to the local API when client/.env is missing
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
});

// When the API can't be reached at all, give a clear message instead of a
// generic "failed" one. Pages read error.response.data.message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.response = {
        status: 0,
        data: {
          success: false,
          message:
            "Can't reach the server. Make sure it is running (npm run dev) and try again.",
        },
      };
    }

    return Promise.reject(error);
  },
);

export default api;
