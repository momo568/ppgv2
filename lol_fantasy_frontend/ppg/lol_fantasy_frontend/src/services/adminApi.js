import axios from 'axios';

const AdminAPI = axios.create({
  baseURL: 'http://localhost:8000/api',
});

const ADMIN_PUBLIC = ['/auth/login/', '/auth/login/choose-otp/', '/auth/login/verify/'];

AdminAPI.interceptors.request.use((config) => {
  const isPublic = ADMIN_PUBLIC.some(r => config.url.includes(r));
  if (!isPublic) {
    const token = localStorage.getItem('admin_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh admin token
let adminRefreshing = false;
AdminAPI.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);
    if (ADMIN_PUBLIC.some(r => original.url.includes(r))) return Promise.reject(err);

    original._retry = true;
    adminRefreshing = true;

    const refresh = localStorage.getItem('admin_refresh_token');
    if (!refresh) {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      window.location.href = '/admin/login';
      return Promise.reject(err);
    }

    try {
      const { data } = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh });
      localStorage.setItem('admin_access_token', data.access);
      if (data.refresh) localStorage.setItem('admin_refresh_token', data.refresh);
      original.headers.Authorization = `Bearer ${data.access}`;
      return AdminAPI(original);
    } catch {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      window.location.href = '/admin/login';
      return Promise.reject(err);
    } finally {
      adminRefreshing = false;
    }
  }
);

export const adminService = {
  // Auth
  login           : (data) => AdminAPI.post('/auth/login/', data),
  chooseOTP       : (data) => AdminAPI.post('/auth/login/choose-otp/', data),
  verifyOTP       : (data) => AdminAPI.post('/auth/login/verify/', data),

  // Stats
  getStats        : ()     => AdminAPI.get('/admin/stats/'),

  // Demandes
  getDemandes     : ()     => AdminAPI.get('/admin/demandes/'),
  approuverDemande: (id)   => AdminAPI.post(`/admin/demandes/${id}/approuver/`),
  rejeterDemande  : (id)   => AdminAPI.post(`/admin/demandes/${id}/rejeter/`),

  // Utilisateurs
  getUtilisateurs : ()     => AdminAPI.get('/admin/utilisateurs/'),
  toggleUser      : (id)   => AdminAPI.post(`/admin/utilisateurs/${id}/toggle/`),
  deleteUser      : (id)   => AdminAPI.delete(`/admin/utilisateurs/${id}/`),
  promouvoirAdmin : (id)   => AdminAPI.post(`/admin/utilisateurs/${id}/promouvoir/`),
  retirerAdmin    : (id)   => AdminAPI.post(`/admin/utilisateurs/${id}/retirer-admin/`),
};

export default AdminAPI;