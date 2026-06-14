import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { authService } from '../services/api';

const MODULES = [
  { to: '/players', icon: '⭐', label: 'Joueurs Pro',  desc: 'Consulte les stats des pros LEC, LCK, LCS, LPL, EMEA, VCS, LJL...' },
  { to: '/leagues', icon: '🏟️', label: 'Ligues',       desc: 'Crée ou rejoins une ligue privée ou publique' },
  { to: '/roster',  icon: '🛡️', label: 'Mon Roster',   desc: 'Compose ton équipe de 5 joueurs (budget 150 cr.)' },
  { to: '/live',        icon: '🔴', label: 'En direct',    desc: 'Regarder les matchs live avec stream intégré' },
  { to: '/matches',     icon: '⚔️', label: 'Matchs',       desc: 'Résultats et stats en temps réel' },
  { to: '/tournaments', icon: '🏆', label: 'Tournois',    desc: 'Classements LEC, LCK, LCS, LPL, EMEA Masters et playoffs' },
  { to: '/scores',  icon: '📊', label: 'Scores',       desc: 'Classement de ta ligue et classement global' },
  { to: '/market',  icon: '💰', label: 'Marché',       desc: 'Historique de tes transferts de joueurs' },
  { to: '/social',  icon: '🌍', label: 'Social',       desc: 'Pronostics, classement et abonnements' },
  { to: '/chatbot', icon: '🤖', label: 'Chatbot',      desc: 'Ton assistant Fantasy en cas de question' },
];

export default function Dashboard() {
  const navigate    = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));
    authService.getProfile()
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => { localStorage.clear(); navigate('/login'); });
  }, [navigate]);

  if (!user) return (
    <div className="auth-container"><span className="spinner large" /></div>
  );

  return (
    <Layout>
      {/* WELCOME */}
      <div className="welcome-card" style={{ marginBottom: 28 }}>
        <h2>Bienvenue, <span>{user.username}</span> ! ⚔️</h2>
        <p style={{ marginTop: 6, color: 'var(--lol-grey-1)' }}>
          Construis ton équipe, rejoins une ligue et grimpe dans le classement.
        </p>
      </div>

      {/* STATS RAPIDES */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <div>
            <p className="stat-label">Points</p>
            <p className="stat-value">{user.points}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div>
            <p className="stat-label">Niveau</p>
            <p className="stat-value">{user.niveau}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔐</span>
          <div>
            <p className="stat-label">2FA</p>
            <p className="stat-value" style={{ color: 'var(--lol-green)', fontSize: 16 }}>Activée</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✉️</span>
          <div>
            <p className="stat-label">Email</p>
            <p className="stat-value" style={{ fontSize: 12 }}>{user.email}</p>
          </div>
        </div>
      </div>

      {/* MODULES NAV */}
      <div style={{ marginBottom: 12 }}>
        <div className="section-title">Modules</div>
      </div>
      <div className="admin-nav-grid">
        {MODULES.map(m => (
          <Link key={m.to} to={m.to} className="admin-nav-card">
            <span>{m.icon}</span>
            <h3>{m.label}</h3>
            <p>{m.desc}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
