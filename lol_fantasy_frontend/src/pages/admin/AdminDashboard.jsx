import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminApi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('admin_access_token')) { navigate('/admin/login'); return; }
    adminService.getStats().then(res => setStats(res.data)).catch(() => navigate('/admin/login'));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  // Périmètre Admin : Joueurs + Ligues publiques uniquement
  const ADMIN_MODULES = [
    {
      to   : '/admin/joueurs',
      icon : '⭐',
      title: 'Gérer les Joueurs',
      desc : 'Ajouter, modifier, supprimer des joueurs pro (LCK/LEC/LCS/LPL)',
    },
    {
      to   : '/admin/ligues',
      icon : '🏟️',
      title: 'Gérer les Ligues publiques',
      desc : 'Créer et administrer les ligues publiques de la plateforme',
    },
    {
      to   : '/admin/demandes',
      icon : '📋',
      title: "Demandes d'inscription",
      desc : 'Approuver ou rejeter les nouvelles demandes',
    },
    {
      to   : '/admin/utilisateurs',
      icon : '👥',
      title: 'Utilisateurs',
      desc : 'Voir et gérer tous les comptes (activer, désactiver, promouvoir Manager)',
    },
  ];

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">⚙️ Administration</div>
        <div className="dash-user">
          <div className="dash-avatar" style={{ background:'rgba(231,76,60,0.2)', color:'#e74c3c', border:'1px solid rgba(231,76,60,0.4)' }}>
            {admin.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--lol-gold-light)' }}>{admin.username}</div>
            <div style={{ fontSize:10, color:'#e74c3c', fontWeight:700, letterSpacing:1 }}>ADMINISTRATEUR</div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
        </div>
      </header>

      <main className="dash-main">
        {/* Rôle et périmètre */}
        <div className="welcome-card" style={{ borderLeft:'3px solid #e74c3c' }}>
          <h2>Panel <span style={{ color:'#e74c3c' }}>Administrateur</span> ⚙️</h2>
          <p style={{ color:'var(--lol-grey-1)', fontSize:13 }}>
            Périmètre : <strong>Gérer les joueurs</strong> et <strong>les ligues publiques</strong>.
            Les ligues privées sont gérées par les Managers.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom:28 }}>
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <div><p className="stat-label">Utilisateurs</p><p className="stat-value">{stats.total_users}</p></div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div><p className="stat-label">En attente</p><p className="stat-value" style={{ color:'#f0c060' }}>{stats.demandes_attente}</p></div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div><p className="stat-label">Approuvées</p><p className="stat-value" style={{ color:'#4ade80' }}>{stats.demandes_approuvees}</p></div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">❌</span>
              <div><p className="stat-label">Rejetées</p><p className="stat-value" style={{ color:'#ff6b6b' }}>{stats.demandes_rejetees}</p></div>
            </div>
          </div>
        )}

        {/* Modules Admin */}
        <div className="section-title" style={{ marginBottom:12 }}>Modules Administration</div>
        <div className="admin-nav-grid">
          {ADMIN_MODULES.map(m => (
            <Link key={m.to} to={m.to} className="admin-nav-card">
              <span>{m.icon}</span>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
            </Link>
          ))}
        </div>

        {/* Note claire sur la séparation des rôles */}
        <div style={{ marginTop:24, background:'rgba(231,76,60,0.05)', border:'1px solid rgba(231,76,60,0.2)', borderRadius:10, padding:'14px 18px', fontSize:12, color:'var(--lol-grey-1)' }}>
          <strong style={{ color:'#e74c3c' }}>⚙️ Séparation des rôles :</strong><br/>
          • <strong>Admin</strong> → joueurs pro + ligues publiques + gestion des comptes<br/>
          • <strong>Manager</strong> → sa propre ligue privée + roster + invitations (hérite du Joueur)<br/>
          • <strong>Joueur</strong> → participer, poster, pronostics, chatbot
        </div>
      </main>
    </div>
  );
}
