import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

// ── Navigation commune Joueur (Manager hérite de tout ça) ────────────────────
const NAV_JOUEUR = [
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

// ── Navigation supplémentaire Manager ────────────────────────────────────────
const NAV_MANAGER = [
  { to: '/manager/dashboard',  icon: '👑', label: 'Panel Manager' },
  { to: '/manager/leagues',    icon: '🏟️', label: 'Mes Ligues'   },
  { to: '/manager/invite',     icon: '✉️',  label: 'Inviter'      },
  { to: '/manager/rosters',    icon: '🛡️', label: 'Tous les Rosters' },
  { to: '/manager/rankings',   icon: '📊', label: 'Classements'  },
];

const ROLE_BADGE = {
  admin  : { label: 'Admin',   color: '#e74c3c' },
  manager: { label: 'Manager', color: '#f39c12' },
  joueur : { label: 'Joueur',  color: '#27ae60' },
};

export default function Layout({ children }) {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem('user') || '{}');
  const [collapsed, setCollapsed] = useState(false);

  const isManager = user.role === 'manager';   // Admin n'hérite PAS du Manager
  const isAdmin   = user.is_staff;
  const badge     = ROLE_BADGE[isAdmin ? 'admin' : (user.role || 'joueur')];

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
          {/* ── Section Joueur (commune à tous) ── */}
          {!collapsed && (
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:'var(--lol-grey-2)',
                          padding:'8px 14px 4px', textTransform:'uppercase' }}>
              Joueur
            </div>
          )}
          {NAV_JOUEUR.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : ''}>
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </NavLink>
          ))}

          {/* ── Section Manager (si rôle manager ou admin) ── */}
          {isManager && (
            <>
              {!collapsed && (
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:'#f39c12',
                              padding:'12px 14px 4px', textTransform:'uppercase', marginTop:4,
                              borderTop:'1px solid rgba(243,156,18,0.2)' }}>
                  Manager
                </div>
              )}
              {collapsed && <div style={{ borderTop:'1px solid rgba(243,156,18,0.2)', margin:'8px 0' }}/>}
              {NAV_MANAGER.map(({ to, icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({ borderLeft: isActive ? '3px solid #f39c12' : undefined })}
                  title={collapsed ? label : ''}>
                  <span className="nav-icon">{icon}</span>
                  {!collapsed && <span className="nav-label">{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="dash-avatar" style={{ position:'relative' }}>
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div className="sidebar-username">{user.username}</div>
                  <span style={{ fontSize:9, fontWeight:700, background: `${badge.color}22`,
                                 color: badge.color, border:`1px solid ${badge.color}55`,
                                 borderRadius:3, padding:'1px 5px', letterSpacing:0.5 }}>
                    {badge.label}
                  </span>
                </div>
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
