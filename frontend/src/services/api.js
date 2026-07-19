import axios from 'axios';
import { auth } from '../firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const uploadFile = async (file, latitude, longitude) => {
  const formData = new FormData();
  formData.append('file', file);
  if (latitude != null && latitude !== '') formData.append('latitude', latitude);
  if (longitude != null && longitude !== '') formData.append('longitude', longitude);
  const { data } = await api.post('/inference/upload', formData);
  return data;
};

export const liveInference = async (blob) => {
  const formData = new FormData();
  formData.append('file', blob, 'live.jpg');
  const { data } = await api.post('/inference/live', formData);
  return data;
};

export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);
export const getAnalysisHistory = () => api.get('/inference/history').then(r => r.data);
export const getReport = (id) => api.get(`/reports/${id}`).then(r => r.data);
export const downloadPdf = (id) => api.get(`/reports/${id}/pdf`, { responseType: 'blob' });
export const downloadCsv = (id) => api.get(`/reports/${id}/csv`, { responseType: 'blob' });
export const getComparison = () => api.get('/reports/compare/history').then(r => r.data);
export const registerProfile = (payload) => api.post('/auth/register', payload).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const getPublicReport = (token) => api.get(`/public/report/${token}`).then(r => r.data);
export const adminGetUsers = () => api.get('/admin/users').then(r => r.data);
export const adminUpdateUser = (id, payload) => api.put(`/admin/users/${id}`, payload).then(r => r.data);
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`).then(r => r.data);
export const adminGetAnalyses = () => api.get('/admin/analyses').then(r => r.data);
export const adminGetAnalytics = () => api.get('/admin/analytics').then(r => r.data);
export const adminOverrideReport = (id, payload) => api.put(`/reports/${id}/override`, payload).then(r => r.data);
