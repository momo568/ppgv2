import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminApi';

export default function AdminUtilisateurs() {
  const navigate = useNavigate();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text:'', type:'success' });
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const isSuperAdmin = adminUser.is_superuser;

  const load = () => {
    setLoading(true);
    adminService.getUtilisateurs()
      .then(res => { setUsers(res.data); setLoading(false); })
      .catch(() => navigate('/admin/login'));
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:'', type:'success' }), 4000);
  };

  const toggle = async (id) => {
    try {
      const res = await adminService.toggleUser(id);
      showMsg(res.data.message);
      load();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Erreur.', 'error');
    }
  };

  const deleteUser = async (id, email) => {
    if (!window.confirm(`Supprimer le compte de ${email} ?`)) return;
    try {
      const res = await adminService.deleteUser(id);
      showMsg(res.data.message);
      load();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Erreur.', 'error');
    }
  };

  const promouvoir = async (id, email) => {
    if (!window.confirm(`Promouvoir ${email} en Administrateur ?`)) return;
    try {
      const res = await adminService.promouvoirAdmin(id);
      showMsg(res.data.message);
      load();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Erreur.', 'error');
    }
  };

  const retirerAdmin = async (id, email) => {
    if (!window.confirm(`Retirer le rôle Admin de ${email} ?`)) return;
    try {
      const res = await adminService.retirerAdmin(id);
      showMsg(res.data.message);
      load();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Erreur.', 'error');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.username.toLowerCase().includes(search.toLowerCase());
    if (filter === 'admins')   return matchSearch && u.is_staff;
    if (filter === 'joueurs')  return matchSearch && !u.is_staff;
    if (filter === 'inactifs') return matchSearch && !u.is_active;
    return matchSearch;
  });

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">⚙️ Admin Panel</div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <Link to="/admin/dashboard"
            style={{ color:'var(--lol-grey-1)', textDecoration:'none', fontSize:'13px' }}>
            ← Dashboard
          </Link>
          <Link to="/admin/demandes"
            style={{ color:'var(--lol-gold-1)', textDecoration:'none', fontSize:'13px' }}>
            📋 Demandes
          </Link>
        </div>
      </header>

      <main className="dash-main">
        <div className="welcome-card">
          <h2>Gestion des <span>utilisateurs</span></h2>
          <p>
            {isSuperAdmin
              ? 'Super Admin — vous pouvez promouvoir et retirer les rôles admin.'
              : 'Admin — vous pouvez activer/désactiver les comptes.'}
          </p>
        </div>

        {/* Message feedback */}
        {message.text && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--r-md)',
            fontSize: '13px',
            textAlign: 'center',
            background: message.type === 'success'
              ? 'rgba(61,220,132,0.08)' : 'rgba(255,77,77,0.08)',
            border: `1px solid ${message.type === 'success'
              ? 'rgba(61,220,132,0.25)' : 'rgba(255,77,77,0.25)'}`,
            color: message.type === 'success' ? '#3ddc84' : '#ff6b6b',
          }}>
            {message.text}
          </div>
        )}

        {/* Filtres */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
          {[
            { key:'all',      label:'Tous' },
            { key:'admins',   label:'⚙️ Admins' },
            { key:'joueurs',  label:'🎮 Joueurs' },
            { key:'inactifs', label:'⛔ Inactifs' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding:'8px 16px', borderRadius:'20px', border:'none',
              cursor:'pointer', fontSize:'12px', letterSpacing:'1px',
              background: filter === f.key
                ? 'linear-gradient(135deg, var(--lol-gold-3), var(--lol-gold-2))'
                : 'rgba(1,10,19,0.8)',
              color: filter === f.key ? 'var(--bg-void)' : 'var(--lol-grey-1)',
              border: filter === f.key
                ? '1px solid var(--lol-gold-1)'
                : '1px solid var(--lol-gold-3)',
              fontFamily: 'var(--font-display)',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <input
          type="text"
          placeholder="🔍 Rechercher par email ou username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width:'100%', background:'rgba(1,10,19,0.7)',
            border:'1px solid var(--lol-gold-3)', borderRadius:'var(--r-md)',
            padding:'12px 16px', color:'var(--lol-gold-light)',
            fontFamily:'var(--font-body)', fontSize:'14px',
            marginBottom:'20px', outline:'none',
          }}
        />

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px' }}>
            <span className="spinner large" />
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {filtered.length === 0 && (
              <p style={{
                color:'var(--lol-grey-2)', textAlign:'center',
                padding:'60px', fontFamily:'var(--font-display)',
                letterSpacing:'2px',
              }}>
                AUCUN UTILISATEUR TROUVÉ
              </p>
            )}

            {filtered.map(u => (
              <div key={u.id} style={{
                background: 'rgba(1,10,19,0.85)',
                border: `1px solid ${u.is_staff ? 'rgba(200,155,60,0.3)' : 'var(--lol-gold-3)'}`,
                borderRadius: 'var(--r-md)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                transition: 'border-color 0.2s',
              }}>
                {/* Infos user */}
                <div style={{ display:'flex', alignItems:'center', gap:'14px', flex:1 }}>
                  <div style={{
                    width:'44px', height:'44px',
                    background: u.is_staff
                      ? 'linear-gradient(135deg, var(--lol-gold-3), var(--lol-gold-2))'
                      : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${u.is_staff ? 'var(--lol-gold-1)' : 'var(--lol-gold-3)'}`,
                    borderRadius: '4px',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: u.is_staff ? 'var(--bg-void)' : 'var(--lol-grey-1)',
                    fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'18px',
                    boxShadow: u.is_staff ? '0 0 12px rgba(200,155,60,0.3)' : 'none',
                    flexShrink: 0,
                  }}>
                    {u.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                      <p style={{ fontWeight:'600', fontSize:'15px', color:'var(--lol-gold-light)' }}>
                        {u.username}
                      </p>
                      {u.is_superuser && (
                        <span style={{
                          padding:'2px 8px', borderRadius:'4px', fontSize:'10px',
                          background:'rgba(200,155,60,0.2)', color:'var(--lol-gold-1)',
                          border:'1px solid var(--lol-gold-3)',
                          fontFamily:'var(--font-display)', letterSpacing:'1px',
                        }}>
                          SUPER ADMIN
                        </span>
                      )}
                      {u.is_staff && !u.is_superuser && (
                        <span style={{
                          padding:'2px 8px', borderRadius:'4px', fontSize:'10px',
                          background:'rgba(200,155,60,0.1)', color:'var(--lol-gold-2)',
                          border:'1px solid rgba(200,155,60,0.2)',
                          fontFamily:'var(--font-display)', letterSpacing:'1px',
                        }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p style={{ color:'var(--lol-grey-1)', fontSize:'13px' }}>{u.email}</p>
                    <p style={{ color:'var(--lol-grey-2)', fontSize:'11px', marginTop:'3px' }}>
                      Inscrit le {u.date_joined} · {u.points} pts · Niv.{u.niveau}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                  {/* Badge statut */}
                  <span style={{
                    padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'600',
                    background: u.is_active
                      ? 'rgba(61,220,132,0.1)' : 'rgba(255,107,107,0.1)',
                    border: `1px solid ${u.is_active ? 'rgba(61,220,132,0.3)' : 'rgba(255,107,107,0.3)'}`,
                    color: u.is_active ? '#3ddc84' : '#ff6b6b',
                  }}>
                    {u.is_active ? '● Actif' : '● Inactif'}
                  </span>

                  {/* Bouton Promouvoir / Retirer Admin (superadmin only) */}
                  {isSuperAdmin && !u.is_superuser && (
                    !u.is_staff ? (
                      <button onClick={() => promouvoir(u.id, u.email)} style={{
                        background:'rgba(200,155,60,0.1)',
                        border:'1px solid var(--lol-gold-3)',
                        color:'var(--lol-gold-1)',
                        padding:'7px 14px', borderRadius:'6px',
                        cursor:'pointer', fontSize:'11px',
                        fontFamily:'var(--font-display)', letterSpacing:'1px',
                        transition:'all 0.2s',
                      }}>
                        ⚙️ PROMOUVOIR
                      </button>
                    ) : (
                      <button onClick={() => retirerAdmin(u.id, u.email)} style={{
                        background:'rgba(255,107,107,0.08)',
                        border:'1px solid rgba(255,107,107,0.25)',
                        color:'#ff8fa3',
                        padding:'7px 14px', borderRadius:'6px',
                        cursor:'pointer', fontSize:'11px',
                        fontFamily:'var(--font-display)', letterSpacing:'1px',
                      }}>
                        RETIRER ADMIN
                      </button>
                    )
                  )}

                  {/* Toggle actif/inactif */}
                  {!u.is_superuser && (
                    <button onClick={() => toggle(u.id)} style={{
                      background: u.is_active
                        ? 'rgba(255,107,107,0.08)' : 'rgba(61,220,132,0.08)',
                      border:`1px solid ${u.is_active
                        ? 'rgba(255,107,107,0.25)' : 'rgba(61,220,132,0.25)'}`,
                      color: u.is_active ? '#ff8fa3' : '#3ddc84',
                      padding:'7px 14px', borderRadius:'6px',
                      cursor:'pointer', fontSize:'11px',
                      fontFamily:'var(--font-display)', letterSpacing:'1px',
                    }}>
                      {u.is_active ? 'DÉSACTIVER' : 'ACTIVER'}
                    </button>
                  )}

                  {/* Supprimer */}
                  {!u.is_superuser && (
                    <button onClick={() => deleteUser(u.id, u.email)} style={{
                      background:'transparent',
                      border:'1px solid rgba(255,255,255,0.08)',
                      color:'var(--lol-grey-2)',
                      padding:'7px 12px', borderRadius:'6px',
                      cursor:'pointer', fontSize:'13px',
                      transition:'all 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.borderColor = 'rgba(255,77,77,0.4)'}
                    onMouseLeave={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}