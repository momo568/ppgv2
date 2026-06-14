import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { managerService } from '../../services/managerApi';

const POS_ICONS = { top:'🗡️', jungle:'🌿', mid:'🔮', adc:'🏹', support:'🛡️' };

export default function ManagerRosters() {
  const { id } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    managerService.getRosters(id).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="page-loading"><span className="spinner large"/></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🛡️ Rosters — {data?.league}</h1>
        <Link to="/manager/leagues" style={{ fontSize:12, color:'var(--lol-gold-1)' }}>← Retour</Link>
      </div>

      <div style={{ fontSize:12, color:'var(--lol-grey-1)', marginBottom:16 }}>
        {data?.count} roster(s) dans cette ligue
      </div>

      <div className="table-wrap">
        {(data?.rosters || []).map((r, idx) => (
          <div key={r.user_id}>
            <div className="rank-row" style={{ cursor:'pointer' }} onClick={() => setExpanded(expanded===r.user_id?null:r.user_id)}>
              <div className={`rank-num ${idx===0?'gold':idx===1?'silver':idx===2?'bronze':''}`}>{idx+1}</div>
              <div className="rank-username">{r.username}</div>
              <div style={{ fontSize:11, color: r.is_complete?'#27ae60':'var(--lol-grey-2)' }}>
                {r.is_complete?'✅ Complet':`⏳ ${r.slots.length}/5 slots`}
              </div>
              <div style={{ fontSize:11, color: r.is_locked?'#e74c3c':'var(--lol-grey-1)' }}>
                {r.is_locked?'🔒 Verrouillé':'🟢 Ouvert'}
              </div>
              <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>{r.budget_used} cr.</div>
              <div className="rank-points">{r.total_points} pts</div>
              <span style={{ fontSize:12, color:'var(--lol-grey-2)' }}>{expanded===r.user_id?'▲':'▼'}</span>
            </div>

            {expanded === r.user_id && (
              <div style={{ padding:'10px 24px 16px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border-gold)' }}>
                {r.slots.length === 0
                  ? <div style={{ fontSize:12, color:'var(--lol-grey-2)' }}>Roster vide</div>
                  : <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {r.slots.map(s => (
                        <div key={s.position} style={{ background:'rgba(4,12,26,0.8)', border:'1px solid var(--border-gold)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                          <div style={{ color:'var(--lol-grey-1)', marginBottom:3 }}>{POS_ICONS[s.position]} {s.position.toUpperCase()}</div>
                          <div style={{ fontWeight:700, color:'var(--lol-gold-light)' }}>{s.player}</div>
                          <div style={{ fontSize:11, color:'var(--lol-grey-2)' }}>{s.team} · {s.price} cr. {s.captain?'★ CAP':''}</div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}
          </div>
        ))}
        {(!data?.rosters || data.rosters.length === 0) && (
          <div style={{ textAlign:'center', padding:24, color:'var(--lol-grey-1)', fontSize:13 }}>Aucun roster pour l'instant.</div>
        )}
      </div>
    </Layout>
  );
}
