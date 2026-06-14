import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminApi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
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

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">⚙️ Admin Panel</div>
        <div className="dash-user">
          <span className="dash-avatar">A</span>
          <span>{admin.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="welcome-card">
          <h2>Tableau de bord <span>Admin</span> ⚙️</h2>
          <p>Gérez les utilisateurs et les demandes d'inscription.</p>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <div>
                <p className="stat-label">Utilisateurs</p>
                <p className="stat-value">{stats.total_users}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div>
                <p className="stat-label">En attente</p>
                <p className="stat-value" style={{ color:'#f0c060' }}>{stats.demandes_attente}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div>
                <p className="stat-label">Approuvées</p>
                <p className="stat-value" style={{ color:'#4ade80' }}>{stats.demandes_approuvees}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">❌</span>
              <div>
                <p className="stat-label">Rejetées</p>
                <p className="stat-value" style={{ color:'#ff6b6b' }}>{stats.demandes_rejetees}</p>
              </div>
            </div>
          </div>
        )}

        <div className="admin-nav-grid">
          <Link to="/admin/demandes" className="admin-nav-card">
            <span>📋</span>
            <h3>Demandes d'inscription</h3>
            <p>Approuver ou rejeter les demandes</p>
          </Link>
          <Link to="/admin/utilisateurs" className="admin-nav-card">
            <span>👥</span>
            <h3>Utilisateurs</h3>
            <p>Gérer tous les comptes</p>
          </Link>
        </div>
      </main>
    </div>
  );
}