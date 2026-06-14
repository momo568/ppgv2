import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';

export default function AdminLigues() {
  const navigate = useNavigate();
  const [leagues, setLeagues]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name:'', description:'', is_private:false, max_members:20, budget_per_team:150 });
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    if (!localStorage.getItem('admin_access_token')) { navigate('/admin/login'); return; }
    load();
  }, [navigate]);

  const load = () => {
    setLoading(true);
    // Admin gère les ligues PUBLIQUES uniquement
    API.get('/leagues/').then(r => {
      setLeagues(r.data.filter(l => !l.is_private));
    }).finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await API.post('/leagues/', { ...form, is_private: false });
      setShowForm(false); setSuccess('Ligue publique créée !'); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.name?.[0] || 'Erreur'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer la ligue "${name}" ?`)) return;
    try { await API.delete(`/leagues/${id}/`); load(); }
    catch { setError('Erreur lors de la suppression'); }
  };

  const handleToggleStatus = async (lg) => {
    const newStatus = lg.status === 'finished' ? 'active' : 'finished';
    try {
      await API.put(`/leagues/${lg.id}/`, { status: newStatus });
      load();
    } catch { setError('Erreur'); }
  };

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
          <h1 className="page-title">🏟️ Ligues Publiques</h1>
          <button className="btn-gold" onClick={() => { setShowForm(true); setError(''); setForm({ name:'', description:'', is_private:false, max_members:20, budget_per_team:150 }); }}>
            + Nouvelle ligue
          </button>
        </div>

        {success && <div className="success-box" style={{ marginBottom:12 }}>{success}</div>}
        {error   && <div className="error-box"   style={{ marginBottom:12 }}>{error}</div>}

        <div style={{ fontSize:12, color:'var(--lol-grey-1)', marginBottom:16 }}>
          L'admin gère uniquement les ligues <strong>publiques</strong>. Les ligues privées appartiennent aux Managers.
        </div>

        {loading ? <div className="page-loading"><span className="spinner large"/></div> : (
          leagues.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">🏟️</span><p>Aucune ligue publique.</p></div>
          ) : (
            <div className="cards-grid">
              {leagues.map(lg => (
                <div key={lg.id} className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div className="player-name">{lg.name}</div>
                    <span style={{ fontSize:11, color: lg.status==='finished'?'#e74c3c':'#27ae60', fontWeight:700 }}>
                      {lg.status === 'finished' ? '🔒 Fermée' : '🟢 Active'}
                    </span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--lol-grey-1)', marginBottom:8 }}>
                    {lg.description || 'Aucune description'}
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--lol-grey-2)', marginBottom:12 }}>
                    <span>👥 {lg.member_count}/{lg.max_members}</span>
                    <span>💰 {lg.budget_per_team} cr.</span>
                    <span>🌍 Publique</span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => handleToggleStatus(lg)}
                      style={{ flex:1, padding:'5px 0', fontSize:11, background: lg.status==='finished'?'rgba(39,174,96,0.12)':'rgba(243,156,18,0.12)', color: lg.status==='finished'?'#27ae60':'#f39c12', border:`1px solid ${lg.status==='finished'?'rgba(39,174,96,0.3)':'rgba(243,156,18,0.3)'}`, borderRadius:5, cursor:'pointer' }}>
                      {lg.status==='finished' ? '🔓 Activer' : '🔒 Fermer'}
                    </button>
                    <button onClick={() => handleDelete(lg.id, lg.name)}
                      style={{ flex:1, padding:'5px 0', fontSize:11, background:'rgba(231,76,60,0.12)', color:'#e74c3c', border:'1px solid rgba(231,76,60,0.3)', borderRadius:5, cursor:'pointer' }}>
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Modal créer */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              <div className="modal-title">🌍 Créer une ligue publique</div>
              <form className="modal-form" onSubmit={handleCreate}>
                <div className="input-group">
                  <label>Nom de la ligue *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="LCS Summer 2025"/>
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({...form, description:e.target.value})}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group">
                    <label>Max membres</label>
                    <input type="number" min={2} max={100} value={form.max_members} onChange={e => setForm({...form, max_members:+e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label>Budget (crédits)</label>
                    <input type="number" min={50} value={form.budget_per_team} onChange={e => setForm({...form, budget_per_team:+e.target.value})}/>
                  </div>
                </div>
                <div style={{ fontSize:12, color:'var(--lol-grey-2)', padding:'8px 0' }}>
                  ℹ️ La ligue sera <strong style={{ color:'#27ae60' }}>publique</strong> — visible par tous les joueurs.
                </div>
                {error && <div className="error-box">{error}</div>}
                <button type="submit" className="btn-primary">Créer la ligue publique</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
