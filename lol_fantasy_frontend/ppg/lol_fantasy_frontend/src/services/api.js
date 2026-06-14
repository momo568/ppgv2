import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000/api' });

const PUBLIC_ROUTES = [
  '/auth/demande/', '/auth/login/', '/auth/login/verify/',
  '/auth/login/choose-otp/', '/auth/forgot-password/',
  '/players/', '/matches/teams/', '/matches/live/', '/matches/schedule/',
  '/matches/tournaments/', '/matches/standings/',
];

// ── Injecte le token sur toutes les routes non-publiques ──────────────────
API.interceptors.request.use((config) => {
  const isPublic = PUBLIC_ROUTES.some(r => config.url.includes(r));
  const token = localStorage.getItem('access_token');
  if (token && !isPublic) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh : si 401, essaie de rafraîchir le token puis retry ───────
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  queue = [];
};

API.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);

    // Pas de retry sur les routes d'auth elles-mêmes
    if (PUBLIC_ROUTES.some(r => original.url.includes(r))) return Promise.reject(err);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`;
        return API(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(err);
    }

    try {
      const { data } = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh });
      const newAccess = data.access;
      localStorage.setItem('access_token', newAccess);
      if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
      API.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return API(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── AUTH ─────────────────────────────────────────────
export const authService = {
  demandeInscription: (data)    => API.post('/auth/demande/', data),
  login             : (data)    => API.post('/auth/login/', data),
  chooseOTP         : (data)    => API.post('/auth/login/choose-otp/', data),
  verifyOTP         : (data)    => API.post('/auth/login/verify/', data),
  forgotPassword    : (data)    => API.post('/auth/forgot-password/', data),
  changePassword    : (data)    => API.post('/auth/change-password/', data),
  getProfile        : ()        => API.get('/auth/profile/'),
  logout            : (refresh) => API.post('/auth/logout/', { refresh }),
};

// ── PLAYERS ──────────────────────────────────────────
export const playerService = {
  list    : (params) => API.get('/players/', { params }),
  detail  : (id)    => API.get(`/players/${id}/`),
  stats   : (id)    => API.get(`/players/${id}/stats/`),
  create  : (data)  => API.post('/players/', data),
  update  : (id, d) => API.put(`/players/${id}/`, d),
  delete  : (id)    => API.delete(`/players/${id}/`),
  addStats: (id, d) => API.post(`/players/${id}/stats/`, d),
};

// ── LEAGUES ──────────────────────────────────────────
export const leagueService = {
  list      : ()        => API.get('/leagues/'),
  myLeagues : ()        => API.get('/leagues/my/'),
  detail    : (id)      => API.get(`/leagues/${id}/`),
  create    : (data)    => API.post('/leagues/', data),
  update    : (id, d)   => API.put(`/leagues/${id}/`, d),
  delete    : (id)      => API.delete(`/leagues/${id}/`),
  join      : (code)    => API.post('/leagues/join/', { invite_code: code }),
  leave     : (id)      => API.post(`/leagues/${id}/leave/`),
  members   : (id)      => API.get(`/leagues/${id}/members/`),
};

// ── ROSTERS ──────────────────────────────────────────
export const rosterService = {
  get       : (lid)           => API.get(`/rosters/${lid}/`),
  create    : (lid)           => API.post(`/rosters/${lid}/`),
  addPlayer : (lid, data)     => API.post(`/rosters/${lid}/add/`, data),
  removePlayer: (lid, pid)    => API.post(`/rosters/${lid}/remove/`, { player_id: pid }),
  setCaptain: (lid, pid)      => API.post(`/rosters/${lid}/captain/`, { player_id: pid }),
};

// ── MATCHES ──────────────────────────────────────────
export const matchService = {
  teams     : (params) => API.get('/matches/teams/', { params }),
  list      : (params) => API.get('/matches/', { params }),
  detail    : (id)     => API.get(`/matches/${id}/`),
  stats     : (id)     => API.get(`/matches/${id}/stats/`),
  create    : (data)   => API.post('/matches/', data),
  update    : (id, d)  => API.put(`/matches/${id}/`, d),
  addStat   : (id, d)  => API.post(`/matches/${id}/stats/`, d),
  // LoL Esports API (données réelles)
  live         : ()       => API.get('/matches/live/'),
  schedule     : (league) => API.get('/matches/schedule/', { params: league ? { league } : {} }),
  tournaments  : (league) => API.get('/matches/tournaments/', { params: { league } }),
  standings    : (tid)    => API.get('/matches/standings/', { params: { tournamentId: tid } }),
  myRoster     : ()       => API.get('/matches/my-roster/'),
  autoSync     : ()       => API.post('/matches/auto-sync/'),
};

// ── SCORES ───────────────────────────────────────────
export const scoreService = {
  my             : (params) => API.get('/scores/my/', { params }),
  global         : ()       => API.get('/scores/global/'),
  leagueRanking  : (lid)    => API.get(`/scores/ranking/${lid}/`),
  calculate      : (mid)    => API.post(`/scores/calculate/${mid}/`),
};

// ── MARKET ───────────────────────────────────────────
export const marketService = {
  history        : (params) => API.get('/market/history/', { params }),
  leagueTransfers: (lid)    => API.get(`/market/league/${lid}/`),
};

// ── SOCIAL ───────────────────────────────────────────
export const socialService = {
  ranking    : ()       => API.get('/social/ranking/'),
  pronostics : (params) => API.get('/social/pronostics/', { params }),
  addPronostic:(data)   => API.post('/social/pronostics/', data),
  follow     : (uid)    => API.post(`/social/follow/${uid}/`),
  unfollow   : (uid)    => API.post(`/social/unfollow/${uid}/`),
  following  : ()       => API.get('/social/following/'),
  followers  : ()       => API.get('/social/followers/'),
};

// ── CHATBOT ──────────────────────────────────────────
export const chatService = {
  send    : (message) => API.post('/chatbot/', { message }),
  history : ()        => API.get('/chatbot/'),
};

export default API;
