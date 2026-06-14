import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { playerService } from '../services/api';

const ROLE_ICONS = { top: '🗡️', jungle: '🌿', mid: '🔮', adc: '🏹', support: '🛡️' };
const REGIONS    = ['', 'LEC', 'LCK', 'LCS', 'LPL', 'VCS', 'LJL', 'PCS', 'CBLOL'];
const ROLES      = ['', 'top', 'jungle', 'mid', 'adc', 'support'];

function PlayerAvatar({ player }) {
  const [err, setErr] = useState(false);
  if (player.image_url && !err) {
    return (
      <img
        src={player.image_url}
        alt={player.in_game_name}
        onError={() => setErr(true)}
        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--lol-gold-3)' }}
      />
    );
  }
  return (
    <div className="player-avatar">
      {(player.in_game_name || 'X')[0].toUpperCase()}
    </div>
  );
}

export default function Players() {
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [region, setRegion]     = useState('');
  const [role, setRole]         = useState('');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (region) params.region = region;
    if (role)   params.role   = role;
    playerService.list(params)
      .then(r => setPlayers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [region, role]);

  const s = search.toLowerCase();
  const filtered = players.filter(p =>
    !search ||
    p.in_game_name.toLowerCase().includes(s) ||
    p.team.toLowerCase().includes(s) ||
    (p.team_code && p.team_code.toLowerCase().includes(s))
  );

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">⭐ Joueurs Pro</h1>
        <span style={{ color: 'var(--lol-grey-1)', fontSize: 13 }}>{filtered.length} joueurs</span>
      </div>

      <div className="filter-bar">
        <input
          className="chat-input"
          style={{ width: 200 }}
          placeholder="Rechercher (nom, équipe...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
          {REGIONS.map(r => <option key={r} value={r}>{r || 'Toutes les régions'}</option>)}
        </select>
        <select className="filter-select" value={role} onChange={e => setRole(e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r ? ROLE_ICONS[r] + ' ' + r.charAt(0).toUpperCase() + r.slice(1) : 'Tous les rôles'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="page-loading"><span className="spinner large" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">⭐</span>
          <p>Aucun joueur trouvé.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map(p => (
            <div
              key={p.id}
              className="card"
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
            >
              <div className="player-card-header">
                <PlayerAvatar player={p} />
                <div>
                  <div className="player-name">{p.in_game_name}</div>
                  <div className="player-team">
                    {p.team_code ? `${p.team_code} · ${p.team}` : p.team}
                  </div>
                </div>
              </div>

              <div className="badges">
                <span className="badge badge-region">{p.region}</span>
                <span className="badge badge-role">{ROLE_ICONS[p.role]} {p.role}</span>
              </div>

              <div className="price-tag">
                {p.price} <span>crédits</span>
              </div>

              {/* Stats au clic */}
              {selected?.id === p.id && (
                <div style={{ marginTop: 14, borderTop: '1px solid var(--border-gold)', paddingTop: 14 }}>
                  {p.stats?.length > 0 ? p.stats.map(s => (
                    <div key={s.id} style={{ marginBottom: 10 }}>
                      <div style={{ color: 'var(--lol-gold-1)', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{s.season}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: 12, color: 'var(--lol-grey-1)' }}>
                        <span>KDA: <b style={{ color: 'var(--lol-gold-light)' }}>{s.kda}</b></span>
                        <span>Win%: <b style={{ color: 'var(--lol-green)' }}>{s.win_rate}%</b></span>
                        <span>K/D/A: {s.kills}/{s.deaths}/{s.assists}</span>
                        <span>CS/min: {s.cs_per_min}</span>
                        <span>Games: {s.games_played}</span>
                        <span>Or/min: {s.gold_per_min}</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ fontSize: 12, color: 'var(--lol-grey-2)', textAlign: 'center' }}>
                      Pas encore de stats pour ce joueur.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
