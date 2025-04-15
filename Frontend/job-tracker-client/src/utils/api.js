import axios from 'axios';

// Create a custom axios instance
const api = axios.create({
  baseURL: 'https://localhost:7116/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to set the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Do not log the error to console
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors silently
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log request details to help with debugging
    if (error.config) {
      console.log('Failed request details:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
    }

    // Don't log auth errors to console
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Handle silently - these will be handled by the auth context
      return Promise.reject(error);
    }

    // Don't log 404 errors to console for applications endpoint
    if (error.response && error.response.status === 404 && 
        error.config.url && error.config.url.includes('/applications')) {
      // Handle silently - these will be handled by components
      return Promise.reject(error);
    }

    // Let other errors propagate but don't log them
    return Promise.reject(error);
  }
);

export default api;