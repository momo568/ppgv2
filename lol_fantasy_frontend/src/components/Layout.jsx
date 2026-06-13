import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const NAV = [
  { to: '/overview',    icon: '🗺️', label: 'Vue d\'ensemble' },
  { to: '/dashboard',   icon: '🏠', label: 'Accueil' },
  { to: '/live',        icon: '🔴', label: 'En direct' },
  { to: '/players',     icon: '⭐', label: 'Joueurs' },
  { to: '/leagues',     icon: '🏟️', label: 'Ligues' },
  { to: '/roster',      icon: '🛡️', label: 'Mon Roster' },
  { to: '/matches',     icon: '⚔️', label: 'Matchs' },
  { to: '/tournaments', icon: '🏆', label: 'Tournois' },
  { to: '/scores',      icon: '📊', label: 'Scores' },
  { to: '/market',      icon: '💰', label: 'Marché' },
  { to: '/social',      icon: '🌍', label: 'Social' },
  { to: '/chatbot',     icon: '🤖', label: 'Chatbot' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try { await authService.logout(localStorage.getItem('refresh_token')); } catch {}
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            {collapsed ? '⚔️' : <><span>⚔️</span> LoL Fantasy</>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : ''}
            >
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="dash-avatar">{user.username?.[0]?.toUpperCase()}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-username">{user.username}</div>
                <div className="sidebar-email">{user.email}</div>
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout} title="Déconnexion">
            {collapsed ? '🚪' : '🚪 Déconnexion'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
