import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { managerService } from '../../services/managerApi';

export default function ManagerDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'manager' && !user.is_staff) {
      navigate('/dashboard');
      return;
    }
    managerService.dashboard()
      .then(r => setData(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <Layout><div className="page-loading"><span className="spinner large"/></div></Layout>;
  if (!data)   return null;

  const MODULES = [
    { to: '/manager/leagues',  icon: '🏟️', label: 'Mes Ligues',     desc: 'Créer, gérer et configurer tes ligues' },
    { to: '/manager/invite',   icon: '✉️',  label: 'Inviter',        desc: 'Envoyer des invitations par email' },
    { to: '/manager/rosters',  icon: '🛡️', label: 'Rosters',        desc: 'Voir tous les rosters de tes ligues' },
    { to: '/manager/rankings', icon: '📊', label: 'Classements',    desc: 'Scores et classements de tes ligues' },
    { to: '/players',          icon: '⭐', label: 'Joueurs Pro',    desc: 'Consulter les joueurs disponibles' },
    { to: '/scores',           icon: '🏆', label: 'Scores Globaux', desc: 'Classement général de la plateforme' },
  ];

  return (
    <Layout>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(200,155,60,0.15),rgba(4,12,26,0.8))', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ width: 52, height: 52, background: 'rgba(200,155,60,0.2)', border: '2px solid var(--lol-gold-1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👑</div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--lol-gold-light)', fontSize: 22 }}>Panel Manager</h2>
            <p style={{ margin: 0, color: 'var(--lol-grey-1)', fontSize: 13 }}>Bienvenue, {data.manager} — gérez vos ligues et participants</p>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(200,155,60,0.15)', border: '1px solid var(--lol-gold-3)', borderRadius: 8, padding: '4px 14px', fontSize: 12, color: 'var(--lol-gold-1)', fontWeight: 700, letterSpacing: 1 }}>
            MANAGER
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { icon: '🏟️', label: 'Ligues',   value: data.total_leagues  },
          { icon: '👥', label: 'Membres',  value: data.total_members  },
          { icon: '🛡️', label: 'Rosters', value: data.total_rosters  },
          { icon: '📊', label: 'Scores calculés', value: data.total_scores },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-icon">{s.icon}</span>
            <div><p className="stat-label">{s.label}</p><p className="stat-value">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Mes ligues aperçu */}
      {data.leagues.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-title">Mes ligues</div>
          <div className="cards-grid">
            {data.leagues.map(lg => (
              <div key={lg.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div className="player-name">{lg.name}</div>
                  <span className={`badge ${lg.is_private ? 'badge-role' : 'badge-region'}`}>{lg.is_private ? '🔒 Privée' : '🌍 Publique'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--lol-grey-1)', marginBottom: 10 }}>
                  👥 {lg.members}/{lg.max_members} membres · 💰 {lg.budget} cr.
                </div>
                {lg.leader && (
                  <div style={{ fontSize: 12, color: 'var(--lol-gold-1)', marginBottom: 10 }}>
                    🥇 Leader: {lg.leader} ({lg.leader_pts} pts)
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-gold)', borderRadius: 4, padding: '2px 8px', color: 'var(--lol-gold-1)', letterSpacing: 2 }}>
                    {lg.invite_code}
                  </span>
                  <Link to={`/manager/leagues/${lg.id}`} style={{ fontSize: 11, color: 'var(--lol-gold-1)', textDecoration: 'none' }}>Gérer →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="section-title" style={{ marginBottom: 12 }}>Actions Manager</div>
      <div className="admin-nav-grid">
        {MODULES.map(m => (
          <Link key={m.to} to={m.to} className="admin-nav-card">
            <span>{m.icon}</span><h3>{m.label}</h3><p>{m.desc}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
