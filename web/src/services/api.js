import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  refresh: (refreshToken) => api.post('/auth/refresh/', { refresh: refreshToken }),
};

// Locker endpoints
export const lockerAPI = {
  getAll: (params) => api.get('/lockers/', { params }),
  getAvailable: () => api.get('/lockers/available/'),
  getById: (id) => api.get(`/lockers/${id}/`),
  create: (data) => api.post('/lockers/', data),
  update: (id, data) => api.put(`/lockers/${id}/`, data),
  delete: (id) => api.delete(`/lockers/${id}/`),
  reactivate: (id) => api.post(`/lockers/${id}/reactivate/`),
  unlock: (data) => api.post('/lockers/unlock/', data),
};

// Reservation endpoints
export const reservationAPI = {
  getAll: () => api.get('/reservations/'),
  getActive: () => api.get('/reservations/active/'),
  getById: (id) => api.get(`/reservations/${id}/`),
  create: (data) => api.post('/reservations/', data),
  update: (id, data) => api.patch(`/reservations/${id}/`, data),
  release: (id) => api.put(`/reservations/${id}/release/`),
};

export default api;