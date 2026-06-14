import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { socialService, matchService } from '../services/api';

function RankMedal({ rank }) {
  const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
  return <div className={`rank-num ${cls}`}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</div>;
}

export default function Social() {
  const [tab, setTab]               = useState('ranking');
  const [ranking, setRanking]       = useState([]);
  const [pronostics, setPronostics] = useState([]);
  const [matches, setMatches]       = useState([]);
  const [following, setFollowing]   = useState([]);
  const [followers, setFollowers]   = useState([]);
  const [loading, setLoading]       = useState(true);

  // Pronostic form
  const [selectedMatch, setSelMatch]  = useState('');
  const [selectedTeam, setSelTeam]    = useState('');
  const [pronosticMsg, setPronosticMsg] = useState('');

  const loadRanking = useCallback(() => {
    setLoading(true);
    socialService.ranking()
      .then(r => setRanking(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRanking();
    socialService.pronostics().then(r => setPronostics(r.data));
    socialService.following().then(r => setFollowing(r.data));
    socialService.followers().then(r => setFollowers(r.data));
    matchService.list({ status: 'scheduled' }).then(r => setMatches(r.data));
  }, [loadRanking]);

  const handleFollow = async (userId, isFollowed) => {
    try {
      if (isFollowed) await socialService.unfollow(userId);
      else            await socialService.follow(userId);
      loadRanking();
      socialService.following().then(r => setFollowing(r.data));
    } catch {}
  };

  const handlePronostic = async (e) => {
    e.preventDefault();
    setPronosticMsg('');
    if (!selectedMatch || !selectedTeam) return;
    try {
      await socialService.addPronostic({ match_id: selectedMatch, predicted_winner_id: selectedTeam });
      setPronosticMsg('✅ Pronostic enregistré !');
      socialService.pronostics().then(r => setPronostics(r.data));
      setSelMatch(''); setSelTeam('');
    } catch (err) {
      setPronosticMsg(err.response?.data?.error || 'Erreur');
    }
  };

  const matchForPronostic = matches.find(m => m.id === +selectedMatch);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🌍 Social</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'ranking'    ? 'active' : ''}`} onClick={() => setTab('ranking')}>Classement</button>
        <button className={`tab ${tab === 'pronostics' ? 'active' : ''}`} onClick={() => setTab('pronostics')}>Pronostics</button>
        <button className={`tab ${tab === 'following'  ? 'active' : ''}`} onClick={() => setTab('following')}>Je suis ({following.length})</button>
        <button className={`tab ${tab === 'followers'  ? 'active' : ''}`} onClick={() => setTab('followers')}>Followers ({followers.length})</button>
      </div>

      {/* CLASSEMENT GLOBAL */}
      {tab === 'ranking' && (
        loading ? <div className="page-loading"><span className="spinner large" /></div> :
        <div className="table-wrap">
          {ranking.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--lol-grey-1)', fontSize: 13 }}>Aucune donnée encore.</div>
          ) : ranking.map(r => (
            <div key={r.user_id} className="rank-row">
              <RankMedal rank={r.rank} />
              <div className="rank-username">
                {r.username}
                {r.pronostics_ok > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--lol-grey-1)' }}>🎯 {r.pronostics_ok} pronostics</span>
                )}
              </div>
              <div className="rank-points">{r.total_points} pts</div>
              <button
                className={`btn-follow ${r.is_followed ? 'following' : ''}`}
                onClick={() => handleFollow(r.user_id, r.is_followed)}
              >
                {r.is_followed ? 'Suivi ✓' : '+ Suivre'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PRONOSTICS */}
      {tab === 'pronostics' && (
        <>
          {/* Formulaire */}
          {matches.length > 0 && (
            <div className="section-card" style={{ marginBottom: 20 }}>
              <div className="section-title">Faire un pronostic</div>
              <form onSubmit={handlePronostic} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                  <label>Match</label>
                  <select className="filter-select" style={{ width: '100%' }} value={selectedMatch} onChange={e => { setSelMatch(e.target.value); setSelTeam(''); }}>
                    <option value="">— Choisir un match —</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{m.team1_acronym} vs {m.team2_acronym} · {new Date(m.date).toLocaleDateString('fr-FR')}</option>
                    ))}
                  </select>
                </div>
                {matchForPronostic && (
                  <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                    <label>Équipe gagnante</label>
                    <select className="filter-select" style={{ width: '100%' }} value={selectedTeam} onChange={e => setSelTeam(e.target.value)}>
                      <option value="">— Choisir —</option>
                      <option value={matchForPronostic.team1}>{matchForPronostic.team1_acronym}</option>
                      <option value={matchForPronostic.team2}>{matchForPronostic.team2_acronym}</option>
                    </select>
                  </div>
                )}
                <button type="submit" className="btn-gold" disabled={!selectedMatch || !selectedTeam}>
                  🎯 Parier
                </button>
              </form>
              {pronosticMsg && (
                <div className={pronosticMsg.startsWith('✅') ? 'success-box' : 'error-box'} style={{ marginTop: 12 }}>
                  {pronosticMsg}
                </div>
              )}
            </div>
          )}

          {/* Liste pronostics */}
          {pronostics.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎯</span>
              <p>Aucun pronostic. Fais ta prédiction avant le début des matchs !</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="lol-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Mon choix</th>
                    <th>Date</th>
                    <th>Résultat</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {pronostics.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.match_info.team1} vs {p.match_info.team2}</td>
                      <td style={{ color: 'var(--lol-blue-1)', fontWeight: 600 }}>{p.predicted_team}</td>
                      <td style={{ color: 'var(--lol-grey-1)', fontSize: 12 }}>{p.match_info.date}</td>
                      <td>
                        {p.is_correct === null ? <span style={{ color: 'var(--lol-grey-1)' }}>En attente</span> :
                         p.is_correct ? <span style={{ color: 'var(--lol-green)' }}>✅ Correct</span> :
                                        <span style={{ color: '#ff6b6b' }}>❌ Raté</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', color: 'var(--lol-gold-1)' }}>
                        {p.points_earned > 0 ? `+${p.points_earned}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* FOLLOWING */}
      {tab === 'following' && (
        following.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>Tu ne suis personne encore. Va dans le classement pour suivre des joueurs !</p>
          </div>
        ) : (
          <div className="table-wrap">
            {following.map(f => (
              <div key={f.user_id} className="rank-row">
                <div className="dash-avatar" style={{ margin: '0 8px' }}>{f.username[0].toUpperCase()}</div>
                <div className="rank-username">{f.username}</div>
                <div style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>Depuis {f.since}</div>
                <button className="btn-follow following" onClick={() => handleFollow(f.user_id, true)}>
                  Suivi ✓
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* FOLLOWERS */}
      {tab === 'followers' && (
        followers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <p>Personne ne te suit encore. Monte dans le classement !</p>
          </div>
        ) : (
          <div className="table-wrap">
            {followers.map(f => (
              <div key={f.user_id} className="rank-row">
                <div className="dash-avatar" style={{ margin: '0 8px' }}>{f.username[0].toUpperCase()}</div>
                <div className="rank-username">{f.username}</div>
                <div style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>Depuis {f.since}</div>
              </div>
            ))}
          </div>
        )
      )}
    </Layout>
  );
}
