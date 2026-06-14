import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { matchService } from '../services/api';

/* ── helpers ─────────────────────────────────────── */
function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function TeamImg({ src, code, size = 64 }) {
  const [err, setErr] = useState(false);
  if (src && !err)
    return <img src={src} alt={code} onError={() => setErr(true)} style={{ width: size, height: size, objectFit: 'contain' }} />;
  return (
    <div style={{
      width: size, height: size,
      background: 'linear-gradient(135deg,var(--lol-gold-3),var(--lol-blue-3))',
      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.35, color: 'var(--lol-gold-light)',
    }}>{(code || '?')[0]}</div>
  );
}

/* ── PLAYER TWITCH ───────────────────────────────── */
function TwitchPlayer({ channel }) {
  return (
    <iframe
      src={`https://player.twitch.tv/?channel=${channel}&parent=localhost&autoplay=true&muted=false`}
      title="Twitch Stream"
      allowFullScreen
      style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 12, background: '#000' }}
    />
  );
}

/* ── PLAYER YOUTUBE ──────────────────────────────── */
function YouTubePlayer({ videoId }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
      title="YouTube Stream"
      allowFullScreen
      allow="autoplay; encrypted-media"
      style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 12, background: '#000' }}
    />
  );
}

/* ── SCOREBOARD EN DIRECT ────────────────────────── */
function Scoreboard({ ev, onStreamChange, selectedStream }) {
  const isMatch = ev.type === 'match' && ev.team1 && ev.team2;

  return (
    <div style={{
      background: 'rgba(1,10,19,0.95)',
      border: '1px solid rgba(249,115,22,0.4)',
      borderRadius: 14, padding: '20px 28px', marginBottom: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Barre orange */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#f97316,transparent)' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ev.leagueImg && <img src={ev.leagueImg} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--lol-gold-1)', letterSpacing: 2 }}>{ev.league}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.5)',
            borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#f97316',
          }}>
            <span style={{ width: 7, height: 7, background: '#f97316', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
            EN DIRECT
          </span>
          {isMatch && <span style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>BO{ev.strategy}</span>}
        </div>
      </div>

      {/* Score (si match) */}
      {isMatch ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <TeamImg src={ev.team1.image} code={ev.team1.code} size={72} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--lol-gold-light)', marginTop: 10 }}>{ev.team1.code}</div>
            <div style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>{ev.team1.name}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 900,
              color: 'var(--lol-gold-1)', letterSpacing: 8,
              textShadow: '0 0 40px rgba(200,155,60,0.5)',
              lineHeight: 1,
            }}>
              {ev.team1.wins} <span style={{ color: 'var(--lol-grey-3, #333)', fontSize: 40 }}>–</span> {ev.team2.wins}
            </div>
            <div style={{ fontSize: 10, color: 'var(--lol-grey-2)', letterSpacing: 3, marginTop: 6 }}>VICTOIRES</div>
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <TeamImg src={ev.team2.image} code={ev.team2.code} size={72} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--lol-gold-light)', marginTop: 10 }}>{ev.team2.code}</div>
            <div style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>{ev.team2.name}</div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--lol-gold-1)', letterSpacing: 2 }}>PRE-SHOW EN COURS</div>
          <div style={{ fontSize: 13, color: 'var(--lol-grey-1)', marginTop: 6 }}>Les matchs commencent bientôt</div>
        </div>
      )}

      {/* Sélecteur de stream */}
      {ev.streams?.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--lol-grey-2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Choisir le stream</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ev.streams.map((s, i) => {
              const label = LOCALE_LABELS[s.locale] || s.locale;
              const icon  = s.provider === 'twitch' ? '💜' : '🔴';
              const isSelected = selectedStream?.param === s.param;
              return (
                <button key={i} onClick={() => onStreamChange(s)}
                  style={{
                    background: isSelected ? 'rgba(200,155,60,0.15)' : 'rgba(1,10,19,0.8)',
                    border: `1px solid ${isSelected ? 'var(--lol-gold-1)' : 'var(--border-gold)'}`,
                    borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                    fontSize: 11, color: isSelected ? 'var(--lol-gold-1)' : 'var(--lol-grey-1)',
                    transition: 'all 0.18s',
                  }}>
                  {icon} {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── CARTE MATCH RÉCENT ──────────────────────────── */
function RecentCard({ m }) {
  if (!m.team1 || !m.team2) return null;
  const win1 = m.team1?.outcome === 'win';
  const win2 = m.team2?.outcome === 'win';
  return (
    <div style={{
      background: 'rgba(1,10,19,0.85)', border: '1px solid var(--border-gold)',
      borderRadius: 10, padding: '14px 18px', marginBottom: 8,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 10, color: 'var(--lol-grey-2)', letterSpacing: 1, flexShrink: 0, width: 70 }}>
        ✅ {fmt(m.startTime)}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, flex: 1, textAlign: 'right', color: win1 ? 'var(--lol-gold-light)' : 'var(--lol-grey-2)' }}>
          {win1 && '🏆 '}{m.team1?.code}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--lol-gold-1)', width: 60, textAlign: 'center', fontWeight: 900 }}>
          {m.team1?.wins} – {m.team2?.wins}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, flex: 1, color: win2 ? 'var(--lol-gold-light)' : 'var(--lol-grey-2)' }}>
          {win2 && '🏆 '}{m.team2?.code}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--lol-gold-1)', fontWeight: 600, flexShrink: 0 }}>{m.league}</div>
    </div>
  );
}

/* ── CONSTANTES ──────────────────────────────────── */
const LOCALE_LABELS = {
  'fr-FR': '🇫🇷 Français', 'en-US': '🇺🇸 English', 'en-GB': '🇬🇧 English',
  'de-DE': '🇩🇪 Deutsch',  'es-ES': '🇪🇸 Español',  'ko-KR': '🇰🇷 한국어',
  'zh-CN': '🇨🇳 中文',     'el-GR': '🇬🇷 Greek',    'tr-TR': '🇹🇷 Türkçe',
  'sr-SR': '🇷🇸 Srpski',   'pl-PL': '🇵🇱 Polski',   'pt-BR': '🇧🇷 Português',
  'it-IT': '🇮🇹 Italiano', 'ru-RU': '🇷🇺 Русский',  'cs-CZ': '🇨🇿 Čeština',
};

const REFRESH_SECS = 30;

/* ── PAGE PRINCIPALE ─────────────────────────────── */
export default function LiveWatch() {
  const [liveEvents, setLiveEvents]     = useState([]);
  const [recentMatches, setRecent]      = useState([]);
  const [selectedEvent, setSelEvent]    = useState(null);
  const [selectedStream, setSelStream]  = useState(null);
  const [selectedGroupIdx, setGroupIdx] = useState(0);
  const [countdown, setCountdown]       = useState(REFRESH_SECS);
  const [loading, setLoading]           = useState(true);
  const [lastRefresh, setLast]          = useState(null);
  const refreshTimer = useRef(null);
  const countTimer   = useRef(null);

  const loadData = () => {
    matchService.live().then(r => {
      const live   = r.data.live   || [];
      const recent = r.data.recently_finished || [];
      setLiveEvents(live);
      setRecent(recent);
      setLast(new Date());
      setCountdown(REFRESH_SECS);

      if (live.length > 0 && !selectedEvent) {
        const ev = live[0];
        setSelEvent(ev);
        const frStream = ev.streams?.find(s => s.locale === 'fr-FR') || ev.streams?.[0];
        if (frStream) setSelStream(frStream);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    refreshTimer.current = setInterval(loadData, REFRESH_SECS * 1000);
    countTimer.current   = setInterval(() => setCountdown(c => c > 0 ? c - 1 : REFRESH_SECS), 1000);
    return () => { clearInterval(refreshTimer.current); clearInterval(countTimer.current); };
  }, []);

  const handleStreamChange = (stream) => {
    setSelStream(stream);
  };

  const hasLive = liveEvents.length > 0;

  return (
    <Layout>
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">
          {hasLive
            ? <>
                <span style={{ color: '#f97316', marginRight: 8 }}>●</span>
                {liveEvents.length > 1
                  ? <>{liveEvents.length} matchs en direct</>
                  : <>Match en direct</>}
              </>
            : '📺 Regarder'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: 'var(--lol-grey-2)' }}>
              Mis à jour {lastRefresh.toLocaleTimeString('fr-FR')}
            </span>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(1,10,19,0.8)', border: '1px solid var(--border-gold)',
            borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--lol-grey-1)',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray={`${(countdown / REFRESH_SECS) * 31.4} 31.4`} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 1s linear' }} />
            </svg>
            Refresh dans {countdown}s
            <button onClick={loadData} style={{ background: 'none', border: 'none', color: 'var(--lol-gold-1)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>↺</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><span className="spinner large" /></div>
      ) : (
        <>
          {/* ── SI MATCH EN DIRECT ── */}
          {hasLive ? (
            (() => {
              // Regrouper les matchs par stream unique
              // Cle = liste des params de stream tries (identique = meme broadcast)
              const getKey = ev => (ev.streams||[]).map(s=>s.param).sort().join('|') || `solo-${ev.id}`;
              const groupMap = {};
              liveEvents.forEach(ev => {
                const k = getKey(ev);
                if (!groupMap[k]) groupMap[k] = { streams: ev.streams||[], events: [] };
                groupMap[k].events.push(ev);
              });
              const groups = Object.values(groupMap);

              // Index du groupe selectionne (clamp au nb de groupes)
              const activeIdx = Math.min(selectedGroupIdx, groups.length - 1);
              const activeGroup = groups[activeIdx];

              return (
                <>
                  {/* ── Sélecteur de groupe si plusieurs streams différents ── */}
                  {groups.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      {groups.map((grp, gi) => {
                        const isSel = gi === activeIdx;
                        const ev0   = grp.events[0] || {};
                        const t1    = (ev0.team1 || {});
                        const t2    = (ev0.team2 || {});
                        const hasTeams = t1.code && t2.code;
                        const label = grp.events.length > 1
                          ? `${grp.events.length} matchs · ${ev0.league || ''}`
                          : hasTeams
                            ? `${t1.code} vs ${t2.code}`
                            : ev0.league || `Match ${gi + 1}`;
                        const hasStream = grp.streams.length > 0;
                        return (
                          <button key={gi} onClick={() => { setGroupIdx(gi); setSelStream(null); }}
                            style={{
                              background: isSel ? 'rgba(249,115,22,0.18)' : 'rgba(1,10,19,0.85)',
                              border: `1.5px solid ${isSel ? '#f97316' : 'rgba(249,115,22,0.3)'}`,
                              borderRadius: 10, padding: '10px 20px', cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                              minWidth: 150, transition: 'all 0.18s',
                              boxShadow: isSel ? '0 0 18px rgba(249,115,22,0.3)' : 'none',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 7, height: 7, background: '#f97316', borderRadius: '50%', display:'inline-block', animation:'pulse-dot 1.5s infinite' }} />
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: isSel ? '#f97316' : 'var(--lol-gold-light)' }}>
                                {label}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--lol-grey-1)', paddingLeft: 13 }}>
                              {ev0.league}{ev0.strategy > 1 ? ` · BO${ev0.strategy}` : ''}
                              {hasStream ? ' · ▶ stream' : ' · 📊 score'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Afficher SEULEMENT le groupe sélectionné ── */}
                  {(() => {
                    const { events, streams } = activeGroup;
                    const cols = events.length === 1 ? '1fr'
                               : events.length === 2 ? '1fr 1fr'
                               : 'repeat(3, 1fr)';
                    const isMulti   = events.length > 1;
                    const defStream = streams.find(s => s.locale === 'fr-FR') || streams[0] || null;
                    const groupStream = selectedStream && streams.some(s => s.param === selectedStream.param)
                      ? selectedStream : defStream;
                    const gi = activeIdx;

                    return (
                      <div key={gi} style={{ marginBottom: 28 }}>

                        {/* Bandeau si plusieurs matchs dans ce groupe */}
                        {isMulti && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
                            borderRadius: 10, padding: '8px 14px',
                          }}>
                            <span style={{ width: 7, height: 7, background: '#f97316', borderRadius: '50%', display:'inline-block', animation:'pulse-dot 1.5s infinite' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>
                              {events.length} matchs — broadcast partagé
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--lol-grey-2)', marginLeft: 'auto' }}>
                              Le stream alterne entre ces matchs
                            </span>
                          </div>
                        )}

                        {/* Scoreboards : 1, 2 ou 3 côte à côte */}
                        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, marginBottom: 12 }}>
                          {events.map((ev, ei) => {
                            const t1 = ev.team1 || {};
                            const t2 = ev.team2 || {};
                            const w1 = t1.wins ?? 0;
                            const w2 = t2.wins ?? 0;
                            return (
                              <div key={ei} style={{
                                background: 'rgba(1,10,19,0.95)',
                                border: '1px solid rgba(249,115,22,0.4)',
                                borderRadius: 12, padding: '14px 18px',
                                position: 'relative', overflow: 'hidden',
                              }}>
                                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#f97316,transparent)' }} />
                                {/* Header */}
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
                                  <span style={{ fontSize:10, color:'var(--lol-grey-1)', fontWeight:700, letterSpacing:1 }}>
                                    {ev.league}
                                  </span>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:12, padding:'2px 8px', fontSize:10, fontWeight:700, color:'#f97316' }}>
                                    <span style={{ width:5, height:5, background:'#f97316', borderRadius:'50%', display:'inline-block', animation:'pulse-dot 1.5s infinite' }} />
                                    LIVE {ev.strategy > 1 ? `BO${ev.strategy}` : ''}
                                  </span>
                                </div>
                                {/* Score */}
                                {t1.code && t2.code ? (
                                  <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between' }}>
                                    <div style={{ textAlign:'center', flex:1 }}>
                                      <TeamImg src={t1.image} code={t1.code} size={events.length === 1 ? 64 : 40} />
                                      <div style={{ fontFamily:'var(--font-display)', fontSize: events.length===1 ? 20 : 15, fontWeight:800, color:'var(--lol-gold-light)', marginTop:6 }}>{t1.code}</div>
                                    </div>
                                    <div style={{ textAlign:'center' }}>
                                      <div style={{ fontFamily:'var(--font-display)', fontSize: events.length===1 ? 52 : 34, fontWeight:900, color:'var(--lol-gold-1)', letterSpacing:4, lineHeight:1 }}>
                                        {w1}<span style={{ color:'rgba(255,255,255,0.15)', fontSize:'60%' }}> – </span>{w2}
                                      </div>
                                      <div style={{ fontSize:8, color:'var(--lol-grey-2)', letterSpacing:2, marginTop:4 }}>VICTOIRES</div>
                                    </div>
                                    <div style={{ textAlign:'center', flex:1 }}>
                                      <TeamImg src={t2.image} code={t2.code} size={events.length === 1 ? 64 : 40} />
                                      <div style={{ fontFamily:'var(--font-display)', fontSize: events.length===1 ? 20 : 15, fontWeight:800, color:'var(--lol-gold-light)', marginTop:6 }}>{t2.code}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ textAlign:'center', padding:'12px 0' }}>
                                    <div style={{ fontSize:28, marginBottom:4 }}>🎙️</div>
                                    <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>Pre-show en cours</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Stream — 1 par groupe (ou "pas de stream") */}
                        {streams.length > 0 ? (
                          <div>
                            {/* Sélecteur de langue */}
                            {streams.length > 1 && (
                              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                                {streams.map((s, si) => {
                                  const label = LOCALE_LABELS[s.locale] || s.locale;
                                  const icon  = s.provider === 'twitch' ? '💜' : '🔴';
                                  const isSel = groupStream?.param === s.param;
                                  return (
                                    <button key={si} onClick={() => setSelStream(s)} style={{
                                      background: isSel ? 'rgba(200,155,60,0.15)' : 'rgba(1,10,19,0.8)',
                                      border: `1px solid ${isSel ? 'var(--lol-gold-1)' : 'var(--border-gold)'}`,
                                      borderRadius: 20, padding:'5px 12px', cursor:'pointer',
                                      fontSize:11, color: isSel ? 'var(--lol-gold-1)' : 'var(--lol-grey-1)',
                                      transition:'all 0.15s',
                                    }}>{icon} {label}</button>
                                  );
                                })}
                              </div>
                            )}
                            <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--border-gold)', boxShadow:'0 0 40px rgba(0,0,0,0.8)' }}>
                              {groupStream?.provider === 'twitch'
                                ? <TwitchPlayer channel={groupStream.param} />
                                : groupStream?.provider === 'youtube'
                                  ? <YouTubePlayer videoId={groupStream.param} />
                                  : null}
                            </div>
                          </div>
                        ) : (
                          <div style={{ background:'rgba(1,10,19,0.85)', border:'1px solid var(--border-gold)', borderRadius:12, padding:'24px', textAlign:'center' }}>
                            <div style={{ fontSize:36, marginBottom:8 }}>📊</div>
                            <div style={{ fontSize:13, color:'var(--lol-grey-1)' }}>Scores en direct — pas de stream disponible</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              );
            })()
          ) : (
            /* ── PAS DE MATCH LIVE ── */
            <div style={{
              background: 'rgba(1,10,19,0.85)', border: '1px solid var(--border-gold)',
              borderRadius: 14, padding: '40px 28px', textAlign: 'center', marginBottom: 24,
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📺</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--lol-gold-light)', marginBottom: 8, letterSpacing: 2 }}>
                AUCUN MATCH EN DIRECT
              </div>
              <div style={{ fontSize: 13, color: 'var(--lol-grey-1)', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
                Les compétitions LEC, LCK, LCS, LPL et EMEA Masters ont lieu en semaine et le week-end.
                Le stream s'affichera automatiquement dès qu'un match commence.
              </div>
              <div style={{ marginTop: 20, fontSize: 12, color: 'var(--lol-grey-2)' }}>
                Prochain rafraîchissement dans {countdown}s
              </div>
            </div>
          )}

          {/* ── MATCHS RÉCEMMENT TERMINÉS ── */}
          {recentMatches.length > 0 && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: 'var(--lol-grey-1)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Récemment terminés
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
              </div>
              {recentMatches.map((m, i) => <RecentCard key={i} m={m} />)}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </Layout>
  );
}
