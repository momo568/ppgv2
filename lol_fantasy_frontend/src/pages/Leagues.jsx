import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { leagueService } from '../services/api';

function LeagueCard({ league, onSelect, isMine, myPoints }) {
  return (
    <div className="card" onClick={() => onSelect(league)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div className="player-name">{league.name}</div>
          <div className="player-team">{league.description || 'Ligue de fantasy'}</div>
        </div>
        <div className="badges">
          <span className={`badge ${league.is_private ? 'badge-role' : 'badge-region'}`}>
            {league.is_private ? '🔒 Privée' : '🌍 Publique'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--lol-grey-1)', marginBottom: 14 }}>
        <span>👥 {league.member_count}/{league.max_members}</span>
        <span>💰 {league.budget_per_team} crédits</span>
        <span>📅 {league.status}</span>
      </div>

      {isMine && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-gold)', paddingTop: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>Mes points</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--lol-gold-1)' }}>{myPoints || 0}</span>
        </div>
      )}
    </div>
  );
}

export default function Leagues() {
  const [tab, setTab]               = useState('my');
  const [myLeagues, setMyLeagues]   = useState([]);
  const [allLeagues, setAllLeagues] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [members, setMembers]       = useState([]);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  // Create form
  const [form, setForm] = useState({ name: '', description: '', is_private: true, max_members: 10, budget_per_team: 150 });
  const [joinCode, setJoinCode] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([leagueService.myLeagues(), leagueService.list()])
      .then(([my, all]) => { setMyLeagues(my.data); setAllLeagues(all.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSelect = async (league) => {
    setSelected(league);
    const res = await leagueService.members(league.id);
    setMembers(res.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await leagueService.create(form);
      setShowCreate(false);
      setSuccess('Ligue créée !');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Erreur création');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await leagueService.join(joinCode);
      setShowJoin(false);
      setSuccess(res.data.message);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide');
    }
  };

  const handleLeave = async (id) => {
    if (!window.confirm('Quitter cette ligue ?')) return;
    try {
      await leagueService.leave(id);
      setSelected(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const displayedLeagues = tab === 'my' ? myLeagues : allLeagues;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🏟️ Ligues</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-blue" onClick={() => setShowJoin(true)}>+ Rejoindre</button>
          <button className="btn-gold" onClick={() => setShowCreate(true)}>+ Créer</button>
        </div>
      </div>

      {success && <div className="success-box" style={{ marginBottom: 16 }}>{success}</div>}
      {error   && <div className="error-box"   style={{ marginBottom: 16 }}>{error}</div>}

      <div className="tabs">
        <button className={`tab ${tab === 'my' ? 'active' : ''}`}  onClick={() => setTab('my')}>Mes ligues</button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>Toutes</button>
      </div>

      {loading ? (
        <div className="page-loading"><span className="spinner large" /></div>
      ) : displayedLeagues.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏟️</span>
          <p>{tab === 'my' ? 'Rejoins ou crée une ligue !' : 'Aucune ligue publique.'}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {displayedLeagues.map(l => (
            <LeagueCard
              key={l.id}
              league={l}
              onSelect={handleSelect}
              isMine={tab === 'my'}
              myPoints={l.my_total_points}
            />
          ))}
        </div>
      )}

      {/* DÉTAIL LIGUE */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="modal-title">{selected.name}</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>Code: <b style={{ color: 'var(--lol-gold-1)', letterSpacing: 3 }}>{selected.invite_code}</b></span>
              <span style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>Budget: {selected.budget_per_team} crédits</span>
            </div>
            <div className="section-title">Classement</div>
            <div className="table-wrap">
              {members.map((m, i) => (
                <div key={m.id} className="rank-row">
                  <div className={`rank-num ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>{i + 1}</div>
                  <div className="rank-username">{m.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>{m.role}</div>
                  <div className="rank-points">{m.total_points} pts</div>
                </div>
              ))}
              {members.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--lol-grey-1)', fontSize: 13 }}>Aucun membre</div>}
            </div>
            <button className="btn-danger" style={{ marginTop: 20 }} onClick={() => handleLeave(selected.id)}>
              Quitter la ligue
            </button>
          </div>
        </div>
      )}

      {/* MODAL CRÉER */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            <div className="modal-title">Créer une ligue</div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="input-group">
                <label>Nom de la ligue</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ma super ligue" />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description (optionnel)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Max membres</label>
                  <input type="number" min={2} max={50} value={form.max_members} onChange={e => setForm({...form, max_members: +e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Budget (crédits)</label>
                  <input type="number" min={50} value={form.budget_per_team} onChange={e => setForm({...form, budget_per_team: +e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="prv" checked={form.is_private} onChange={e => setForm({...form, is_private: e.target.checked})} style={{ width: 16, height: 16 }} />
                <label htmlFor="prv" style={{ fontSize: 14, color: 'var(--lol-grey-1)', cursor: 'pointer' }}>Ligue privée (code requis)</label>
              </div>
              {error && <div className="error-box">{error}</div>}
              <button type="submit" className="btn-primary">Créer</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REJOINDRE */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoin(false)}>✕</button>
            <div className="modal-title">Rejoindre une ligue</div>
            <form className="modal-form" onSubmit={handleJoin}>
              <div className="input-group">
                <label>Code d'invitation</label>
                <input required value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="EX: ABC12345" style={{ letterSpacing: 4, fontSize: 18, textAlign: 'center' }} />
              </div>
              {error && <div className="error-box">{error}</div>}
              <button type="submit" className="btn-primary">Rejoindre</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
