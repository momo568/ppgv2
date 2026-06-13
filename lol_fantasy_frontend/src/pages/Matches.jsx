import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { matchService } from '../services/api';

const REGIONS = ['', 'LEC', 'LCK', 'LCS', 'LPL'];

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function TeamLogo({ team }) {
  const [err, setErr] = useState(false);
  if (team.image && !err)
    return <img src={team.image} alt={team.code} style={{ width: 52, height: 52, objectFit: 'contain', marginBottom: 6 }} onError={() => setErr(true)} />;
  return (
    <div style={{ width: 52, height: 52, marginBottom: 6, background: 'linear-gradient(135deg,var(--lol-gold-3),var(--lol-blue-3))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--lol-gold-light)' }}>
      {(team.code || '?')[0]}
    </div>
  );
}

function LiveCard({ m }) {
  const hasTeams = m.team1 && m.team2;
  return (
    <div style={{ background: 'rgba(1,10,19,0.92)', border: '1px solid rgba(249,115,22,0.5)', borderRadius: 12, padding: '20px 28px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#f97316,transparent)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#f97316', border: '1px solid rgba(249,115,22,0.5)', borderRadius: 4, padding: '3px 8px' }}>🔴 EN DIRECT</span>
        <span style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>{m.league}{m.strategy ? ` · BO${m.strategy}` : ''}</span>
      </div>
      {hasTeams ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TeamLogo team={m.team1} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--lol-gold-light)' }}>{m.team1.code}</div>
            <div style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>{m.team1.name}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 900, color: 'var(--lol-gold-1)', letterSpacing: 6, textShadow: '0 0 24px rgba(200,155,60,0.5)' }}>
              {m.team1.wins} <span style={{ color: 'var(--lol-grey-2)', fontSize: 26 }}>–</span> {m.team2.wins}
            </div>
            <div style={{ fontSize: 10, color: 'var(--lol-grey-2)', letterSpacing: 2, marginTop: 4 }}>SCORE EN JEUX</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TeamLogo team={m.team2} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--lol-gold-light)' }}>{m.team2.code}</div>
            <div style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>{m.team2.name}</div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--lol-gold-1)', letterSpacing: 2 }}>PRE-SHOW EN COURS</div>
          <div style={{ fontSize: 12, color: 'var(--lol-grey-1)', marginTop: 4 }}>Les matchs commencent bientôt</div>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ m }) {
  const isLive = m.state === 'inProgress';
  const isDone = m.state === 'completed';
  const win1   = (m.team1?.outcome) === 'win';
  const win2   = (m.team2?.outcome) === 'win';
  if (!m.team1 || !m.team2) return null;

  return (
    <div style={{
      background: 'rgba(1,10,19,0.88)',
      border: `1px solid ${isLive ? 'rgba(249,115,22,0.5)' : isDone ? 'rgba(200,170,110,0.25)' : 'var(--border-gold)'}`,
      borderRadius: 10, padding: '16px 22px', marginBottom: 10,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      transition: 'all 0.2s',
    }}>

      {/* Statut + date */}
      <div style={{ width: 110, flexShrink: 0 }}>
        {isLive
          ? <span style={{ color: '#f97316', fontWeight: 700, fontSize: 11 }}>🔴 EN DIRECT</span>
          : isDone
            ? <span style={{ color: 'var(--lol-green)', fontSize: 11, fontWeight: 600 }}>✅ Terminé</span>
            : <span style={{ color: 'var(--lol-grey-1)', fontSize: 11 }}>📅 {fmt(m.startTime)}</span>
        }
        {isDone && (
          <div style={{ fontSize: 10, color: 'var(--lol-grey-2)', marginTop: 2 }}>
            {fmt(m.startTime)}
          </div>
        )}
      </div>

      {/* Équipes + score */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>

        {/* Équipe 1 */}
        <div style={{ flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          {m.team1.image && (
            <img src={m.team1.image} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={e => e.target.style.display='none'} />
          )}
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
            color: win1 ? 'var(--lol-gold-light)' : win2 ? 'var(--lol-grey-2)' : 'var(--lol-gold-light)',
          }}>
            {m.team1.code}
            {win1 && <span style={{ marginLeft: 4, fontSize: 12 }}>🏆</span>}
          </span>
        </div>

        {/* Score central */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: isDone || isLive ? 24 : 14,
          fontWeight: 900,
          color: isDone || isLive ? 'var(--lol-gold-1)' : 'var(--lol-grey-2)',
          width: 72, textAlign: 'center', flexShrink: 0,
          textShadow: isDone ? '0 0 12px rgba(200,155,60,0.3)' : 'none',
        }}>
          {isDone || isLive ? `${m.team1.wins} – ${m.team2.wins}` : 'VS'}
        </div>

        {/* Équipe 2 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
            color: win2 ? 'var(--lol-gold-light)' : win1 ? 'var(--lol-grey-2)' : 'var(--lol-gold-light)',
          }}>
            {win2 && <span style={{ marginRight: 4, fontSize: 12 }}>🏆</span>}
            {m.team2.code}
          </span>
          {m.team2.image && (
            <img src={m.team2.image} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={e => e.target.style.display='none'} />
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--lol-grey-1)', flexShrink: 0, minWidth: 80 }}>
        <div style={{ color: 'var(--lol-gold-1)', fontWeight: 700, fontSize: 12 }}>{m.league}</div>
        <div style={{ marginTop: 2 }}>{m.blockName}</div>
        <div style={{ color: 'var(--lol-grey-2)' }}>BO{m.strategy}</div>
      </div>
    </div>
  );
}

export default function Matches() {
  const [tab, setTab]                   = useState('schedule');
  const [live, setLive]                 = useState([]);
  const [recentlyFinished, setRecent]   = useState([]);
  const [schedule, setSchedule]         = useState([]);
  const [myMatches, setMyMatches]       = useState([]);
  const [region, setRegion]             = useState('');
  const [stateFilter, setStateFilter]   = useState('completed');
  const [scheduleLoading, setSchLoading] = useState(false);  // état séparé
  const [myLoading,      setMyLoading]  = useState(false);   // état séparé
  const [lastRefresh, setLast]          = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const timer = useRef(null);

  // Quand filtre = inProgress, on prend les matchs live (getLive) car ils ne sont pas dans getSchedule
  const liveAsSchedule = live
    .filter(m => m.team1 && m.team2)
    .map(m => ({ ...m, state: 'inProgress' }));

  const baseSchedule = stateFilter === 'inProgress'
    ? [...liveAsSchedule, ...schedule.filter(m => m.state === 'inProgress')]
    : schedule.filter(m => stateFilter === 'all' || m.state === stateFilter);

  const filteredSchedule = baseSchedule.sort((a, b) =>
    stateFilter === 'completed'
      ? new Date(b.startTime) - new Date(a.startTime)
      : new Date(a.startTime) - new Date(b.startTime)
  );

  const loadLive = () => {
    matchService.live()
      .then(r => { setLive(r.data.live || []); setRecent(r.data.recently_finished || []); setLast(new Date()); })
      .catch(() => {});
  };

  const loadSchedule = (reg) => {
    setSchLoading(true);
    matchService.schedule(reg)
      .then(r  => setSchedule(r.data.schedule || []))
      .catch(() => setSchedule([]))
      .finally(() => setSchLoading(false));
  };

  const loadMyMatches = () => {
    setMyLoading(true);
    matchService.myRoster()
      .then(r  => setMyMatches(r.data.schedule || []))
      .catch(() => setMyMatches([]))
      .finally(() => setMyLoading(false));
  };

  useEffect(() => {
    loadLive();
    loadSchedule('');          // calendrier initial
    loadMyMatches();           // roster initial
    timer.current = setInterval(loadLive, 30000);
    return () => clearInterval(timer.current);
  }, []);

  useEffect(() => {
    if (tab === 'schedule') { setStateFilter('completed'); loadSchedule(region); }
    if (tab === 'my')       loadMyMatches();
  }, [region, tab]);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">⚔️ Matchs</h1>
        {lastRefresh && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--lol-grey-1)' }}>
            <span>Mis à jour {lastRefresh.toLocaleTimeString('fr-FR')}</span>
            <button onClick={loadLive} style={{ background: 'transparent', border: '1px solid var(--lol-gold-3)', color: 'var(--lol-gold-1)', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>↺</button>
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
          {live.length > 0 ? '🔴' : '⚫'} En direct
          {live.length > 0 && <span style={{ marginLeft: 6, background: '#f97316', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{live.length}</span>}
        </button>
        <button className={`tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>📅 Calendrier LEC/LCK/LCS/LPL</button>
        <button className={`tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>🗂️ Mes matchs</button>
      </div>

      {tab === 'live' && (
        <>
          {live.length > 0 ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--lol-grey-1)', marginBottom: 16 }}>
                {live.length} match{live.length > 1 ? 's' : ''} en cours · données LoL Esports officielles
              </div>
              {live.map((m, i) => <LiveCard key={m.id || i} m={m} />)}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔴</div>
              <div style={{ fontSize: 14, color: 'var(--lol-grey-1)', marginBottom: 16 }}>
                Aucun match en direct en ce moment
              </div>
              <button className="btn-gold" onClick={() => setTab('schedule')}>
                📅 Voir le calendrier LEC / LCK / LCS / LPL
              </button>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--lol-grey-2)' }}>
                Rafraîchissement automatique toutes les 30s
              </div>
            </div>
          )}

          {/* RÉCEMMENT TERMINÉS */}
          {recentlyFinished.length > 0 && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 3, color: 'var(--lol-grey-2)',
                textTransform: 'uppercase', marginBottom: 10, paddingTop: 4,
              }}>
                Récemment terminés
              </div>
              {recentlyFinished.map((m, i) => <ScheduleCard key={m.id || i} m={m} />)}
            </>
          )}
        </>
      )}

      {tab === 'schedule' && (
        <>
          <div className="filter-bar">
            <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
              {REGIONS.map(r => <option key={r} value={r}>{r || 'Toutes les régions'}</option>)}
            </select>
            {['all','completed','inProgress','unstarted'].map(s => (
              <button
                key={s}
                className={`filter-btn ${stateFilter === s ? 'active' : ''}`}
                onClick={() => setStateFilter(s)}
              >
                {s === 'all'        ? 'Tous'
                : s === 'completed'  ? '✅ Terminés'
                : s === 'inProgress' ? '🔴 En direct'
                :                     '📅 À venir'}
              </button>
            ))}
          </div>
          {scheduleLoading ? (
            <div className="page-loading"><span className="spinner large" /></div>
          ) : filteredSchedule.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">{stateFilter === 'inProgress' ? '🔴' : '📅'}</span>
              <p>
                {stateFilter === 'inProgress'
                  ? 'Aucun match en direct en ce moment.'
                  : stateFilter === 'unstarted'
                  ? 'Aucun match à venir programmé.'
                  : 'Aucun match pour ce filtre.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--lol-grey-1)', marginBottom: 12 }}>
                {filteredSchedule.length} match{filteredSchedule.length > 1 ? 's' : ''} · source officielle LoL Esports
              </div>
              {filteredSchedule.map((m, i) => <ScheduleCard key={m.id || i} m={m} />)}
            </>
          )}
        </>
      )}

      {tab === 'my' && (
        <>
          {myLoading ? (
            <div className="page-loading"><span className="spinner large" /></div>
          ) : myMatches.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🛡️</span>
              <p>Compose un roster dans une ligue pour voir ici les matchs de tes équipes.</p>
              <button className="btn-gold" style={{ marginTop: 12 }} onClick={() => window.location.href = '/roster'}>
                Composer mon roster
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--lol-grey-1)', marginBottom: 12 }}>
                {myMatches.length} match{myMatches.length > 1 ? 's' : ''} de tes équipes · source officielle LoL Esports
              </div>
              {myMatches.map((m, i) => (
                <div key={m.id || i} style={{ position: 'relative' }}>
                  {m.my_team && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8, zIndex: 1,
                      background: 'rgba(200,155,60,0.15)', border: '1px solid var(--lol-gold-3)',
                      borderRadius: 4, padding: '2px 8px', fontSize: 10,
                      color: 'var(--lol-gold-1)', fontWeight: 700, letterSpacing: 1,
                    }}>
                      {m.my_team} dans ton roster
                    </div>
                  )}
                  <ScheduleCard m={m} />
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Layout>
  );
}
