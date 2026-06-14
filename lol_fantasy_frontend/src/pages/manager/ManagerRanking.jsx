import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { managerService } from '../../services/managerApi';

export default function ManagerRanking() {
  const [leagues, setLeagues] = useState([]);
  const [selId, setSelId]     = useState('');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    managerService.getLeagues().then(r => {
      setLeagues(r.data);
      if (r.data.length > 0) { setSelId(String(r.data[0].id)); load(r.data[0].id); }
    });
  }, []);

  const load = (lid) => {
    setLoading(true);
    managerService.getRanking(lid).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">📊 Classements Manager</h1>
        <Link to="/manager/dashboard" style={{ fontSize:12, color:'var(--lol-gold-1)' }}>← Dashboard</Link>
      </div>

      <div className="filter-bar" style={{ marginBottom:20 }}>
        <select className="filter-select" value={selId}
          onChange={e => { setSelId(e.target.value); if(e.target.value) load(e.target.value); }}>
          <option value="">— Choisir une ligue —</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {!selId ? (
        <div className="empty-state"><span className="empty-icon">📊</span><p>Sélectionne une ligue.</p></div>
      ) : loading ? (
        <div className="page-loading"><span className="spinner large"/></div>
      ) : data && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Classement */}
          <div>
            <div className="section-title">🏆 Classement — {data.league}</div>
            <div className="table-wrap">
              {data.ranking.map(r => (
                <div key={r.rank} className="rank-row">
                  <div className={`rank-num ${r.rank===1?'gold':r.rank===2?'silver':r.rank===3?'bronze':''}`}>{r.rank}</div>
                  <div className="rank-username">{r.username}</div>
                  <span style={{ fontSize:11, color: r.role==='manager'?'#f39c12':'var(--lol-grey-2)', fontWeight: r.role==='manager'?700:400 }}>
                    {r.role==='manager'?'👑':'👤'}
                  </span>
                  <div className="rank-points">{r.total_points} pts</div>
                </div>
              ))}
              {data.ranking.length === 0 && (
                <div style={{ padding:20, textAlign:'center', color:'var(--lol-grey-1)', fontSize:13 }}>
                  Aucun score encore calculé.
                </div>
              )}
            </div>
          </div>

          {/* Historique */}
          <div>
            <div className="section-title">⚡ Derniers scores</div>
            <div className="table-wrap">
              {data.recent_scores.map((s, i) => (
                <div key={i} className="rank-row">
                  <div className="rank-username" style={{ fontSize:12 }}>{s.username}</div>
                  <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>{s.match}</div>
                  <div style={{ fontSize:11, color:'var(--lol-grey-2)' }}>{s.date}</div>
                  <div className="rank-points">+{s.points} pts</div>
                </div>
              ))}
              {data.recent_scores.length === 0 && (
                <div style={{ padding:20, textAlign:'center', color:'var(--lol-grey-1)', fontSize:13 }}>
                  Aucun score récent.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
