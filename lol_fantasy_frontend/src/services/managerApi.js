import axios from 'axios';

const ManagerAPI = axios.create({ baseURL: 'http://localhost:8000/api' });

ManagerAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token
ManagerAPI.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err);
    orig._retry = true;
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) { localStorage.clear(); window.location.href = '/login'; return Promise.reject(err); }
    try {
      const { data } = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh });
      localStorage.setItem('access_token', data.access);
      if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
      orig.headers.Authorization = `Bearer ${data.access}`;
      return ManagerAPI(orig);
    } catch {
      localStorage.clear(); window.location.href = '/login'; return Promise.reject(err);
    }
  }
);

export const managerService = {
  // Dashboard
  dashboard    : ()              => ManagerAPI.get('/manager/dashboard/'),

  // Ligues
  getLeagues   : ()              => ManagerAPI.get('/manager/leagues/'),
  createLeague : (data)          => ManagerAPI.post('/manager/leagues/', data),
  updateLeague : (id, data)      => ManagerAPI.put(`/manager/leagues/${id}/`, data),
  deleteLeague : (id)            => ManagerAPI.delete(`/manager/leagues/${id}/`),

  // Membres
  getMembers   : (id)            => ManagerAPI.get(`/manager/leagues/${id}/members/`),
  removeMember : (id, userId)    => ManagerAPI.delete(`/manager/leagues/${id}/members/`, { data: { user_id: userId } }),

  // Invitations
  invite       : (id, emails)    => ManagerAPI.post(`/manager/leagues/${id}/invite/`, { emails }),

  // Rosters
  getRosters   : (id)            => ManagerAPI.get(`/manager/leagues/${id}/rosters/`),

  // Lock
  lockLeague   : (id)            => ManagerAPI.post(`/manager/leagues/${id}/lock/`, { action: 'lock' }),
  unlockLeague : (id)            => ManagerAPI.post(`/manager/leagues/${id}/lock/`, { action: 'unlock' }),

  // Classement
  getRanking   : (id)            => ManagerAPI.get(`/manager/leagues/${id}/ranking/`),
};

export default ManagerAPI;
