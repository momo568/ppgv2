import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { scoreService, leagueService, matchService } from '../services/api';

function RankMedal({ rank }) {
  const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
  return <div className={`rank-num ${cls}`}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</div>;
}

export default function Scores() {
  const [tab, setTab]             = useState('ranking');
  const [leagues, setLeagues]     = useState([]);
  const [selectedLeague, setSel]  = useState('');
  const [ranking, setRanking]     = useState([]);
  const [global, setGlobal]       = useState([]);
  const [myScores, setMyScores]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const r = await matchService.autoSync();
      setSyncMsg(r.data.message);
      // Recharger les scores
      scoreService.global().then(r => setGlobal(r.data));
      scoreService.my().then(r => setMyScores(r.data));
      if (selectedLeague) scoreService.leagueRanking(selectedLeague).then(r => setRanking(r.data));
    } catch {
      setSyncMsg('Erreur lors de la synchronisation.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    leagueService.myLeagues().then(r => setLeagues(r.data));
    scoreService.global().then(r => setGlobal(r.data));
    scoreService.my().then(r => setMyScores(r.data));
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      setLoading(true);
      scoreService.leagueRanking(selectedLeague)
        .then(r => setRanking(r.data))
        .finally(() => setLoading(false));
    }
  }, [selectedLeague]);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">📊 Scores</h1>
        <button
          className="btn-gold"
          onClick={handleSync}
          disabled={syncing}
          title="Récupère les résultats des derniers matchs et calcule les points"
        >
          {syncing ? <span className="spinner" /> : '⚡ Sync résultats'}
        </button>
      </div>
      {syncMsg && (
        <div className="success-box" style={{ marginBottom: 16 }}>{syncMsg}</div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'ranking'  ? 'active' : ''}`} onClick={() => setTab('ranking')}>Ligue</button>
        <button className={`tab ${tab === 'global'   ? 'active' : ''}`} onClick={() => setTab('global')}>Global</button>
        <button className={`tab ${tab === 'my'       ? 'active' : ''}`} onClick={() => setTab('my')}>Mes scores</button>
      </div>

      {/* CLASSEMENT LIGUE */}
      {tab === 'ranking' && (
        <>
          <div className="filter-bar">
            <select className="filter-select" value={selectedLeague} onChange={e => setSel(e.target.value)}>
              <option value="">— Choisir une ligue —</option>
              {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {!selectedLeague ? (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>Sélectionne une ligue pour voir le classement.</p>
            </div>
          ) : loading ? (
            <div className="page-loading"><span className="spinner large" /></div>
          ) : (
            <div className="table-wrap">
              {ranking.map((r, i) => (
                <div key={i} className="rank-row">
                  <RankMedal rank={r.rank} />
                  <div className="rank-username">{r.username}</div>
                  <span style={{ fontSize: 11, color: r.role === 'manager' ? 'var(--lol-gold-1)' : 'var(--lol-grey-2)' }}>
                    {r.role === 'manager' ? '👑 Manager' : 'Membre'}
                  </span>
                  <div className="rank-points">{r.total_points} pts</div>
                </div>
              ))}
              {ranking.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--lol-grey-1)', fontSize: 13 }}>
                  Aucun score calculé pour cette ligue.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CLASSEMENT GLOBAL */}
      {tab === 'global' && (
        <div className="table-wrap">
          {global.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--lol-grey-1)', fontSize: 13 }}>
              Aucune donnée globale encore disponible.
            </div>
          ) : global.map((r, i) => (
            <div key={i} className="rank-row">
              <RankMedal rank={r.rank} />
              <div className="rank-username">{r.username}</div>
              <div className="rank-points">{r.total_points} pts</div>
            </div>
          ))}
        </div>
      )}

      {/* MES SCORES */}
      {tab === 'my' && (
        <>
          {myScores.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>Aucun score encore. Compose un roster et attends les matchs !</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="lol-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Tournoi</th>
                    <th>Ligue</th>
                    <th>Date</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {myScores.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.match_info.team1} vs {s.match_info.team2}</td>
                      <td style={{ color: 'var(--lol-grey-1)' }}>{s.match_info.tournament}</td>
                      <td style={{ color: 'var(--lol-grey-1)', fontSize: 12 }}>{s.league}</td>
                      <td style={{ color: 'var(--lol-grey-1)', fontSize: 12 }}>{s.match_info.date}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--lol-gold-1)', fontWeight: 700 }}>
                        {s.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
