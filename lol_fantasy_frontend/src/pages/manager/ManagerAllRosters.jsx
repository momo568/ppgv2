import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { managerService } from '../../services/managerApi';

const POS_ICONS = { top:'🗡️', jungle:'🌿', mid:'🔮', adc:'🏹', support:'🛡️' };

export default function ManagerAllRosters() {
  const [leagues, setLeagues]   = useState([]);
  const [selId, setSelId]       = useState('');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    managerService.getLeagues().then(r => {
      setLeagues(r.data);
      if (r.data.length > 0) { setSelId(String(r.data[0].id)); load(r.data[0].id); }
    });
  }, []);

  const load = (lid) => {
    setLoading(true);
    managerService.getRosters(lid).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🛡️ Rosters de mes ligues</h1>
      </div>

      <div className="filter-bar" style={{ marginBottom:20 }}>
        <select className="filter-select" value={selId}
          onChange={e => { setSelId(e.target.value); if(e.target.value) load(e.target.value); }}>
          <option value="">— Choisir une ligue —</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.is_private?'🔒':'🌍'} {l.name}</option>)}
        </select>
      </div>

      {!selId ? (
        <div className="empty-state"><span className="empty-icon">🛡️</span><p>Sélectionne une ligue.</p></div>
      ) : loading ? (
        <div className="page-loading"><span className="spinner large"/></div>
      ) : data && (
        <>
          <div style={{ fontSize:12, color:'var(--lol-grey-1)', marginBottom:12 }}>
            {data.count} roster(s) dans <strong style={{ color:'var(--lol-gold-light)' }}>{data.league}</strong>
          </div>

          <div className="table-wrap">
            {data.rosters.length === 0 ? (
              <div style={{ textAlign:'center', padding:30, color:'var(--lol-grey-1)', fontSize:13 }}>
                Aucun roster dans cette ligue.
              </div>
            ) : data.rosters.map((r, idx) => (
              <div key={r.user_id}>
                <div className="rank-row" style={{ cursor:'pointer' }}
                  onClick={() => setExpanded(expanded === r.user_id ? null : r.user_id)}>

                  <div className={`rank-num ${idx===0?'gold':idx===1?'silver':idx===2?'bronze':''}`}>{idx+1}</div>
                  <div className="rank-username">{r.username}</div>

                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:11, color:r.is_complete?'#27ae60':'#f39c12' }}>
                      {r.is_complete ? '✅ Complet' : `⏳ ${r.slots.length}/5`}
                    </span>
                    {r.is_locked && <span style={{ fontSize:10, color:'#e74c3c', border:'1px solid rgba(231,76,60,0.3)', borderRadius:4, padding:'1px 6px' }}>🔒</span>}
                  </div>

                  <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>{r.budget_used} cr.</div>
                  <div className="rank-points">{r.total_points} pts</div>
                  <span style={{ fontSize:11, color:'var(--lol-grey-2)' }}>{expanded===r.user_id?'▲':'▼'}</span>
                </div>

                {expanded === r.user_id && (
                  <div style={{ padding:'12px 24px 16px', background:'rgba(4,12,26,0.5)', borderBottom:'1px solid var(--border-gold)' }}>
                    {r.slots.length === 0 ? (
                      <div style={{ fontSize:12, color:'var(--lol-grey-2)' }}>Roster vide</div>
                    ) : (
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {r.slots.map(s => (
                          <div key={s.position} style={{
                            background:'rgba(4,12,26,0.9)', border:'1px solid var(--border-gold)',
                            borderRadius:8, padding:'8px 14px', minWidth:120,
                          }}>
                            <div style={{ fontSize:10, color:'var(--lol-grey-2)', marginBottom:3 }}>
                              {POS_ICONS[s.position]} {s.position.toUpperCase()}
                            </div>
                            <div style={{ fontWeight:700, color:'var(--lol-gold-light)', fontSize:13 }}>{s.player}</div>
                            <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>
                              {s.team} · {s.price} cr.
                              {s.captain && <span style={{ color:'var(--lol-gold-1)', marginLeft:4 }}>★</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
