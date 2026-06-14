import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminApi';
import API from '../../services/api';

const REGIONS = ['', 'LEC', 'LCK', 'LCS', 'LPL', 'VCS', 'LJL', 'PCS', 'CBLOL'];
const ROLES   = ['', 'top', 'jungle', 'mid', 'adc', 'support'];
const ROLE_ICONS = { top:'🗡️', jungle:'🌿', mid:'🔮', adc:'🏹', support:'🛡️' };

export default function AdminJoueurs() {
  const navigate = useNavigate();
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [region, setRegion]     = useState('');
  const [role, setRole]         = useState('');
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ in_game_name:'', name:'', team:'', team_code:'', role:'mid', region:'LCK', price:12 });
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    if (!localStorage.getItem('admin_access_token')) { navigate('/admin/login'); return; }
    load();
  }, [navigate, region, role]);

  const load = () => {
    setLoading(true);
    const params = {};
    if (region) params.region = region;
    if (role)   params.role   = role;
    API.get('/players/', { params })
      .then(r => setPlayers(r.data))
      .finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ in_game_name:'', name:'', team:'', team_code:'', role:'mid', region:'LCK', price:12 });
    setShowForm(true); setError('');
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ in_game_name:p.in_game_name, name:p.name||'', team:p.team, team_code:p.team_code||'', role:p.role, region:p.region, price:p.price });
    setShowForm(true); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) {
        await API.put(`/players/${editing}/`, form);
        setSuccess('Joueur modifié.');
      } else {
        await API.post('/players/', form);
        setSuccess('Joueur créé.');
      }
      setShowForm(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Erreur'));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    try { await API.delete(`/players/${id}/`); load(); }
    catch { setError('Erreur suppression'); }
  };

  const filtered = players.filter(p =>
    !search ||
    p.in_game_name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase()) ||
    (p.team_code||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">⚙️ Administration</div>
        <div className="dash-user">
          <Link to="/admin/dashboard" style={{ fontSize:12, color:'var(--lol-gold-1)' }}>← Dashboard</Link>
          <button className="btn-logout" onClick={() => { localStorage.clear(); navigate('/admin/login'); }}>Déconnexion</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="page-header">
          <h1 className="page-title">⭐ Gérer les Joueurs</h1>
          <button className="btn-gold" onClick={openCreate}>+ Nouveau joueur</button>
        </div>

        {success && <div className="success-box" style={{ marginBottom:12 }}>{success}</div>}
        {error   && <div className="error-box"   style={{ marginBottom:12 }}>{error}</div>}

        {/* Filtres */}
        <div className="filter-bar" style={{ marginBottom:16 }}>
          <input className="chat-input" style={{ width:180 }} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
            {REGIONS.map(r => <option key={r} value={r}>{r || 'Toutes régions'}</option>)}
          </select>
          <select className="filter-select" value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r ? `${ROLE_ICONS[r]} ${r}` : 'Tous rôles'}</option>)}
          </select>
          <span style={{ fontSize:12, color:'var(--lol-grey-1)' }}>{filtered.length} joueurs</span>
        </div>

        {loading ? <div className="page-loading"><span className="spinner large"/></div> : (
          <div className="cards-grid">
            {filtered.map(p => (
              <div key={p.id} className="card">
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.in_game_name} style={{ width:44, height:44, objectFit:'cover', borderRadius:6, border:'1px solid var(--border-gold)' }} onError={e=>e.target.style.display='none'}/>
                  ) : (
                    <div style={{ width:44, height:44, borderRadius:6, background:'rgba(200,155,60,0.15)', border:'1px solid var(--border-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:18, color:'var(--lol-gold-light)' }}>
                      {p.in_game_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="player-name">{p.in_game_name}</div>
                    <div className="player-team">{p.team_code || p.team}</div>
                  </div>
                </div>
                <div className="badges" style={{ marginBottom:8 }}>
                  <span className="badge badge-region">{p.region}</span>
                  <span className="badge badge-role">{ROLE_ICONS[p.role]} {p.role}</span>
                  <span style={{ fontSize:12, color:'var(--lol-gold-1)' }}>{p.price} cr.</span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => openEdit(p)} style={{ flex:1, padding:'5px 0', fontSize:11, background:'rgba(52,152,219,0.12)', color:'#3498db', border:'1px solid rgba(52,152,219,0.3)', borderRadius:5, cursor:'pointer' }}>
                    ✏️ Modifier
                  </button>
                  <button onClick={() => handleDelete(p.id, p.in_game_name)} style={{ flex:1, padding:'5px 0', fontSize:11, background:'rgba(231,76,60,0.12)', color:'#e74c3c', border:'1px solid rgba(231,76,60,0.3)', borderRadius:5, cursor:'pointer' }}>
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal créer/modifier */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              <div className="modal-title">{editing ? '✏️ Modifier joueur' : '+ Nouveau joueur'}</div>
              <form className="modal-form" onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group">
                    <label>Pseudo (IGN) *</label>
                    <input required value={form.in_game_name} onChange={e => setForm({...form, in_game_name:e.target.value})} placeholder="Faker"/>
                  </div>
                  <div className="input-group">
                    <label>Vrai nom</label>
                    <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Lee Sang-hyeok"/>
                  </div>
                  <div className="input-group">
                    <label>Équipe</label>
                    <input value={form.team} onChange={e => setForm({...form, team:e.target.value})} placeholder="T1"/>
                  </div>
                  <div className="input-group">
                    <label>Code équipe</label>
                    <input value={form.team_code} onChange={e => setForm({...form, team_code:e.target.value})} placeholder="T1"/>
                  </div>
                  <div className="input-group">
                    <label>Rôle</label>
                    <select value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
                      {ROLES.filter(r=>r).map(r => <option key={r} value={r}>{ROLE_ICONS[r]} {r}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Région</label>
                    <select value={form.region} onChange={e => setForm({...form, region:e.target.value})}>
                      {REGIONS.filter(r=>r).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Prix (crédits)</label>
                    <input type="number" min={5} max={50} value={form.price} onChange={e => setForm({...form, price:+e.target.value})}/>
                  </div>
                </div>
                {error && <div className="error-box">{error}</div>}
                <button type="submit" className="btn-primary">{editing ? 'Modifier' : 'Créer'}</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
