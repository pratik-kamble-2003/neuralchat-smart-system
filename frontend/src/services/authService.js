import api from './api';

export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  logoutAll: () => api.post('/api/auth/logout-all'),
  refresh: () => api.post('/api/auth/refresh'),
  getMe: () => api.get('/api/auth/me'),
};
