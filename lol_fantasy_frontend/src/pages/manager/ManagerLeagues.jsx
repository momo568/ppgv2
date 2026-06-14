import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { managerService } from '../../services/managerApi';

export default function ManagerLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]  = useState({ name:'', description:'', is_private:true, max_members:10, budget_per_team:150 });
  const [error, setError]  = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    managerService.getLeagues()
      .then(r => setLeagues(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.role !== 'manager' && !u.is_staff) { navigate('/dashboard'); return; }
    load();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await managerService.createLeague(form);
      setShowCreate(false); setSuccess('Ligue créée !'); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.name?.[0] || 'Erreur'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return;
    try { await managerService.deleteLeague(id); load(); }
    catch { setError('Erreur suppression'); }
  };

  const toggleLock = async (lg) => {
    try {
      const action = lg.status === 'finished' ? 'unlock' : 'lock';
      await (action === 'lock' ? managerService.lockLeague(lg.id) : managerService.unlockLeague(lg.id));
      setSuccess(action === 'lock' ? 'Ligue verrouillée.' : 'Ligue déverrouillée.'); load();
      setTimeout(() => setSuccess(''), 2500);
    } catch { setError('Erreur'); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">👑 Mes Ligues</h1>
        <button className="btn-gold" onClick={() => setShowCreate(true)}>+ Créer une ligue</button>
      </div>

      {success && <div className="success-box" style={{ marginBottom: 16 }}>{success}</div>}
      {error   && <div className="error-box"   style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? <div className="page-loading"><span className="spinner large"/></div>
      : leagues.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏟️</span>
          <p>Aucune ligue. Crée ta première ligue !</p>
        </div>
      ) : (
        <div className="cards-grid">
          {leagues.map(lg => (
            <div key={lg.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div className="player-name">{lg.name}</div>
                <span className={`badge ${lg.is_private?'badge-role':'badge-region'}`}>
                  {lg.is_private?'🔒':'🌍'} {lg.is_private?'Privée':'Publique'}
                </span>
              </div>
              <div style={{ fontSize:12, color:'var(--lol-grey-1)', marginBottom:8 }}>
                {lg.description || 'Aucune description'}
              </div>
              <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--lol-grey-1)', marginBottom:10 }}>
                <span>👥 {lg.member_count}/{lg.max_members}</span>
                <span>💰 {lg.budget} cr.</span>
                <span>📅 {lg.created_at}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:10, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-gold)', borderRadius:4, padding:'2px 10px', color:'var(--lol-gold-1)', letterSpacing:2 }}>
                  {lg.invite_code}
                </span>
                <span style={{ fontSize:11, color: lg.status==='finished'?'#e74c3c':'#27ae60', fontWeight:700 }}>
                  {lg.status==='finished'?'🔒 Verrouillée':'🟢 Active'}
                </span>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Link to={`/manager/leagues/${lg.id}/members`} style={{ fontSize:11, padding:'5px 10px', background:'rgba(52,152,219,0.15)', color:'#3498db', border:'1px solid rgba(52,152,219,0.3)', borderRadius:6, textDecoration:'none', cursor:'pointer' }}>
                  👥 Membres
                </Link>
                <Link to={`/manager/leagues/${lg.id}/rosters`} style={{ fontSize:11, padding:'5px 10px', background:'rgba(39,174,96,0.15)', color:'#27ae60', border:'1px solid rgba(39,174,96,0.3)', borderRadius:6, textDecoration:'none', cursor:'pointer' }}>
                  🛡️ Rosters
                </Link>
                <Link to={`/manager/leagues/${lg.id}/ranking`} style={{ fontSize:11, padding:'5px 10px', background:'rgba(155,89,182,0.15)', color:'#9b59b6', border:'1px solid rgba(155,89,182,0.3)', borderRadius:6, textDecoration:'none', cursor:'pointer' }}>
                  📊 Classement
                </Link>
                <button onClick={() => toggleLock(lg)} style={{ fontSize:11, padding:'5px 10px', background: lg.status==='finished'?'rgba(39,174,96,0.12)':'rgba(243,156,18,0.12)', color: lg.status==='finished'?'#27ae60':'#f39c12', border:`1px solid ${lg.status==='finished'?'rgba(39,174,96,0.3)':'rgba(243,156,18,0.3)'}`, borderRadius:6, cursor:'pointer' }}>
                  {lg.status==='finished'?'🔓 Déverrouiller':'🔒 Verrouiller'}
                </button>
                <button onClick={() => handleDelete(lg.id, lg.name)} style={{ fontSize:11, padding:'5px 10px', background:'rgba(231,76,60,0.12)', color:'#e74c3c', border:'1px solid rgba(231,76,60,0.3)', borderRadius:6, cursor:'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal créer */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            <div className="modal-title">👑 Créer une ligue</div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="input-group">
                <label>Nom de la ligue</label>
                <input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Ma Super Ligue"/>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Description (optionnel)"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="input-group">
                  <label>Max membres</label>
                  <input type="number" min={2} max={50} value={form.max_members} onChange={e => setForm({...form, max_members:+e.target.value})}/>
                </div>
                <div className="input-group">
                  <label>Budget (crédits)</label>
                  <input type="number" min={50} value={form.budget_per_team} onChange={e => setForm({...form, budget_per_team:+e.target.value})}/>
                </div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:'var(--lol-grey-1)', cursor:'pointer' }}>
                <input type="checkbox" checked={form.is_private} onChange={e => setForm({...form, is_private:e.target.checked})} style={{ width:16, height:16 }}/>
                Ligue privée (code requis)
              </label>
              {error && <div className="error-box">{error}</div>}
              <button type="submit" className="btn-primary">Créer</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
