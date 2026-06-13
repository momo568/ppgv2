import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { matchService, scoreService, leagueService, authService, playerService } from '../services/api';

/* ── helpers ─────────────────────────────────────── */
function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function TeamImg({ src, code, size = 32 }) {
  const [err, setErr] = useState(false);
  if (src && !err)
    return <img src={src} alt={code} onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: 'contain' }} />;
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: 'linear-gradient(135deg,var(--lol-gold-3),var(--lol-blue-3))',
      borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.4, color: 'var(--lol-gold-light)',
    }}>{(code || '?')[0]}</div>
  );
}

/* ── WIDGET LIVE ─────────────────────────────────── */
function LiveWidget({ events }) {
  if (!events || events.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {events.map((ev, i) => {
        const hasTeams = ev.team1 && ev.team2;
        return (
          <Link key={i} to="/live" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'rgba(1,10,19,0.95)',
              border: '1px solid rgba(249,115,22,0.6)',
              borderRadius: 12, padding: '14px 20px',
              marginBottom: 8, position: 'relative', overflow: 'hidden',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.6)'}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#f97316,transparent)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: '#f97316', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#f97316', letterSpacing: 2 }}>EN DIRECT</span>
                  <span style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>{ev.league}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--lol-gold-1)' }}>▶ Regarder</span>
              </div>

              {hasTeams && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamImg src={ev.team1.image} code={ev.team1.code} size={36} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--lol-gold-light)' }}>{ev.team1.code}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--lol-gold-1)', letterSpacing: 4 }}>
                    {ev.team1.wins} – {ev.team2.wins}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row-reverse' }}>
                    <TeamImg src={ev.team2.image} code={ev.team2.code} size={36} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--lol-gold-light)' }}>{ev.team2.code}</span>
                  </div>
                </div>
              )}
              {!hasTeams && (
                <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 13, color: 'var(--lol-grey-1)' }}>
                  🎙️ Pre-show en cours — matchs bientôt !
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ── WIDGET RÉSULTATS RÉCENTS ─────────────────────── */
function RecentResults({ matches }) {
  if (!matches || matches.length === 0)
    return <div style={{ fontSize: 12, color: 'var(--lol-grey-2)', padding: '12px 0' }}>Aucun résultat récent.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {matches.slice(0, 6).map((m, i) => {
        if (!m.team1 || !m.team2) return null;
        const win1 = m.team1.outcome === 'win';
        const win2 = m.team2.outcome === 'win';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 10, color: 'var(--lol-grey-2)', width: 24, flexShrink: 0, fontWeight: 700, background: 'rgba(11,196,127,0.1)', border: '1px solid rgba(11,196,127,0.2)', borderRadius: 4, padding: '2px 4px', textAlign: 'center' }}>
              {m.league?.slice(0, 3)}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, flex: 1, textAlign: 'right', color: win1 ? 'var(--lol-gold-light)' : 'var(--lol-grey-2)' }}>
              {win1 && '🏆 '}{m.team1.code}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--lol-gold-1)', fontWeight: 900, width: 52, textAlign: 'center' }}>
              {m.team1.wins}–{m.team2.wins}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, flex: 1, color: win2 ? 'var(--lol-gold-light)' : 'var(--lol-grey-2)' }}>
              {win2 && '🏆 '}{m.team2.code}
            </span>
            <span style={{ fontSize: 10, color: 'var(--lol-grey-2)', flexShrink: 0 }}>{fmt(m.startTime)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── WIDGET PROCHAINS MATCHS ──────────────────────── */
function UpcomingMatches({ matches }) {
  const upcoming = (matches || []).filter(m => m.state === 'unstarted' && m.team1 && m.team2).slice(0, 5);
  if (upcoming.length === 0)
    return <div style={{ fontSize: 12, color: 'var(--lol-grey-2)', padding: '12px 0' }}>Aucun match programmé.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {upcoming.map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 10, color: 'var(--lol-gold-1)', width: 24, flexShrink: 0, fontWeight: 700, background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 4, padding: '2px 4px', textAlign: 'center' }}>
            {m.league?.slice(0, 3)}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, flex: 1, textAlign: 'right', color: 'var(--lol-gold-light)' }}>{m.team1.code}</span>
          <span style={{ fontSize: 11, color: 'var(--lol-grey-2)', width: 52, textAlign: 'center' }}>VS</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, flex: 1, color: 'var(--lol-gold-light)' }}>{m.team2.code}</span>
          <span style={{ fontSize: 10, color: 'var(--lol-grey-1)', flexShrink: 0 }}>{fmt(m.startTime)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── WIDGET CLASSEMENT FANTASY ────────────────────── */
function FantasyRanking({ ranking }) {
  if (!ranking || ranking.length === 0)
    return <div style={{ fontSize: 12, color: 'var(--lol-grey-2)', padding: '12px 0' }}>Rejoins une ligue pour voir le classement.</div>;
  return (
    <div>
      {ranking.slice(0, 5).map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: 24, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--lol-grey-2)', flexShrink: 0 }}>
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
          </div>
          <div style={{ flex: 1, fontWeight: r.isMe ? 700 : 400, color: r.isMe ? 'var(--lol-gold-1)' : 'var(--lol-gold-light)', fontSize: 14 }}>
            {r.username}{r.isMe && ' (moi)'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--lol-gold-1)', fontWeight: 700 }}>
            {r.total_points} pts
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── SECTION CARD ─────────────────────────────────── */
function Section({ title, icon, to, children, badge }) {
  return (
    <div style={{ background: 'rgba(1,10,19,0.85)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '18px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--lol-grey-1)' }}>{title}</span>
          {badge && <span style={{ background: '#f97316', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
        </div>
        {to && <Link to={to} style={{ fontSize: 11, color: 'var(--lol-gold-1)', textDecoration: 'none', opacity: 0.7 }}>Voir tout →</Link>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

/* ── WIDGET TOP PERFORMERS ────────────────────────── */
function TopPerformers({ players }) {
  const ROLE_ICONS = { top: '🗡️', jungle: '🌿', mid: '🔮', adc: '🏹', support: '🛡️' };
  const stars = [...players]
    .filter(p => p.stats && p.stats.length > 0)
    .map(p => {
      const s = p.stats[0];
      return { ...p, kda: s.kda, kills: s.kills, assists: s.assists, deaths: s.deaths, win_rate: s.win_rate };
    })
    .sort((a, b) => b.kda - a.kda)
    .slice(0, 6);

  if (stars.length === 0)
    return <div style={{ fontSize: 12, color: 'var(--lol-grey-2)', padding: '12px 0' }}>Pas encore de stats. Ajoute-en via Django Admin.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {stars.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(1,10,19,0.6)', border: '1px solid var(--border-gold)', borderRadius: 8 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,var(--lol-gold-3),var(--lol-blue-3))', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--lol-gold-light)', flexShrink: 0 }}>
            {p.in_game_name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lol-gold-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {ROLE_ICONS[p.role]} {p.in_game_name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--lol-grey-1)' }}>{p.team}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--lol-gold-1)', fontWeight: 700 }}>KDA {p.kda}</div>
            <div style={{ fontSize: 10, color: 'var(--lol-grey-1)' }}>{p.kills}K / {p.deaths}D / {p.assists}A</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── WIDGET SCORING ───────────────────────────────── */
function ScoringGuide() {
  const rules = [
    { action: 'Kill',         pts: '+3 pts',  color: 'var(--lol-green)' },
    { action: 'Assist',       pts: '+1.5 pts', color: 'var(--lol-green)' },
    { action: 'Mort',         pts: '-1 pt',   color: '#ff6b6b' },
    { action: 'Victoire',     pts: '+2 pts',  color: 'var(--lol-gold-1)' },
    { action: 'KDA ≥ 5',      pts: '+2 pts',  color: 'var(--lol-gold-1)' },
    { action: 'KDA ≥ 10',     pts: '+5 pts',  color: 'var(--lol-gold-1)' },
    { action: 'CS/min ≥ 8',   pts: '+1 pt',   color: 'var(--lol-blue-1)' },
    { action: 'Capitaine ★',  pts: '× 1.5',   color: '#ffd700' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {rules.map(r => (
        <div key={r.action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(1,10,19,0.6)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>{r.action}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: r.color, fontFamily: 'var(--font-display)' }}>{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

/* ── PAGE ─────────────────────────────────────────── */
export default function Overview() {
  const [user, setUser]         = useState(null);
  const [live, setLive]         = useState([]);
  const [recent, setRecent]     = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [global, setGlobal]     = useState([]);
  const [myLeagues, setMyLeagues] = useState([]);
  const [leagueRanking, setLeagueRanking] = useState([]);
  const [myScores, setMyScores] = useState([]);
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const refreshRef = useRef(null);

  const me = JSON.parse(localStorage.getItem('user') || '{}');

  const loadAll = async () => {
    try {
      const [liveRes, schedRes, globalRes, myLeaguesRes, myScoresRes, playersRes] = await Promise.allSettled([
        matchService.live(),
        matchService.schedule(''),
        scoreService.global(),
        leagueService.myLeagues(),
        scoreService.my(),
        playerService.list(),
      ]);

      if (liveRes.status === 'fulfilled') {
        setLive(liveRes.value.data.live || []);
        setRecent(liveRes.value.data.recently_finished || []);
      }
      if (schedRes.status === 'fulfilled')    setSchedule(schedRes.value.data.schedule || []);
      if (globalRes.status === 'fulfilled')   setGlobal(globalRes.value.data || []);
      if (myLeaguesRes.status === 'fulfilled') {
        const leagues = myLeaguesRes.value.data || [];
        setMyLeagues(leagues);
        if (leagues.length > 0) {
          try {
            const rankRes = await scoreService.leagueRanking(leagues[0].id);
            const ranked = (rankRes.data || []).map(r => ({ ...r, isMe: r.username === me.username }));
            setLeagueRanking(ranked);
          } catch {}
        }
      }
      if (myScoresRes.status === 'fulfilled') setMyScores(myScoresRes.value.data || []);
      if (playersRes.status === 'fulfilled')  setPlayers(playersRes.value.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    authService.getProfile().then(r => setUser(r.data)).catch(() => {});
    loadAll();
    refreshRef.current = setInterval(() => {
      matchService.live().then(r => {
        setLive(r.data.live || []);
        setRecent(r.data.recently_finished || []);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(refreshRef.current);
  }, []);

  const totalPoints  = myScores.reduce((s, sc) => s + sc.points, 0).toFixed(0);
  const myLeagueName = myLeagues[0]?.name || null;
  const myRank       = leagueRanking.findIndex(r => r.isMe) + 1;

  return (
    <Layout>
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Vue d'ensemble</h1>
          {user && <div style={{ fontSize: 13, color: 'var(--lol-grey-1)', marginTop: 4 }}>Bonjour, <b style={{ color: 'var(--lol-gold-1)' }}>{user.username}</b> 👋</div>}
        </div>
        {live.length > 0 && (
          <Link to="/live" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.5)', borderRadius: 20, padding: '8px 16px', cursor: 'pointer' }}>
              <span style={{ width: 8, height: 8, background: '#f97316', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>{live.length} match{live.length > 1 ? 's' : ''} EN DIRECT</span>
              <span style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>▶ Regarder</span>
            </div>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="page-loading"><span className="spinner large" /></div>
      ) : (
        <>
          {/* LIVE en haut si présent */}
          {live.length > 0 && <LiveWidget events={live} />}

          {/* MES STATS FANTASY */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { icon: '🏆', label: 'Mes points', value: totalPoints, color: 'var(--lol-gold-1)' },
              { icon: '🏟️', label: 'Ma ligue', value: myLeagueName || '—', color: 'var(--lol-gold-light)', small: true },
              { icon: '📊', label: 'Mon rang', value: myRank > 0 ? `#${myRank}` : '—', color: myRank === 1 ? '#ffd700' : 'var(--lol-gold-1)' },
              { icon: '🎮', label: 'Matchs joués', value: myScores.length, color: 'var(--lol-grey-1)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(1,10,19,0.85)', border: '1px solid var(--border-gold)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--lol-grey-2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: s.small ? 14 : 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* GRILLE PRINCIPALE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

            {/* RÉSULTATS RÉCENTS */}
            <Section title="Résultats récents" icon="✅" to="/matches">
              <RecentResults matches={recent} />
              {recent.length === 0 && (
                <RecentResults matches={schedule.filter(m => m.state === 'completed')} />
              )}
            </Section>

            {/* PROCHAINS MATCHS */}
            <Section title="Prochains matchs" icon="📅" to="/matches">
              <UpcomingMatches matches={schedule} />
            </Section>

            {/* CLASSEMENT MA LIGUE */}
            <Section title={myLeagueName ? `Classement · ${myLeagueName}` : 'Classement ligue'} icon="🏟️" to="/scores">
              {myLeagues.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--lol-grey-2)', padding: '12px 0' }}>
                  <Link to="/leagues" style={{ color: 'var(--lol-gold-1)' }}>Rejoins une ligue</Link> pour voir ton classement.
                </div>
              ) : (
                <FantasyRanking ranking={leagueRanking} />
              )}
            </Section>
          </div>

          {/* TOP PERFORMERS + SCORING */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
            <Section title="Top joueurs (KDA)" icon="⭐" to="/players">
              <TopPerformers players={players} />
            </Section>
            <Section title="Système de points" icon="📋" to={null}>
              <ScoringGuide />
            </Section>
          </div>

          {/* CLASSEMENT GLOBAL + ACTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* CLASSEMENT GLOBAL */}
            <Section title="Top 5 Global" icon="🌍" to="/scores">
              {global.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 24, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 15, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--lol-grey-2)', flexShrink: 0 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: r.username === me.username ? 'var(--lol-gold-1)' : 'var(--lol-gold-light)', fontWeight: r.username === me.username ? 700 : 400 }}>
                    {r.username}{r.username === me.username && ' ★'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--lol-gold-1)', fontWeight: 700 }}>{r.total_points} pts</div>
                </div>
              ))}
              {global.length === 0 && <div style={{ fontSize: 12, color: 'var(--lol-grey-2)', padding: '12px 0' }}>Aucun score enregistré encore.</div>}
            </Section>

            {/* ACTIONS RAPIDES */}
            <Section title="Accès rapide" icon="⚡" to={null}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { to: '/live',        icon: '🔴', label: 'Regarder en direct', sub: live.length > 0 ? `${live.length} match live` : 'Pas de match en ce moment', highlight: live.length > 0 },
                  { to: '/roster',      icon: '🛡️', label: 'Mon Roster',         sub: 'Gérer mon équipe de 5 joueurs' },
                  { to: '/tournaments', icon: '🏆', label: 'Tournois',            sub: 'Classements LEC · LCK · LCS · LPL' },
                  { to: '/players',     icon: '⭐', label: '300 joueurs pros',    sub: 'Faker, Caps, Chovy, Ruler...' },
                  { to: '/social',      icon: '🎯', label: 'Pronostics',          sub: 'Parie sur les résultats' },
                  { to: '/chatbot',     icon: '🤖', label: 'Chatbot',             sub: 'Aide et conseils fantasy' },
                ].map(a => (
                  <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
                      background: a.highlight ? 'rgba(249,115,22,0.08)' : 'rgba(1,10,19,0.6)',
                      border: `1px solid ${a.highlight ? 'rgba(249,115,22,0.4)' : 'var(--border-gold)'}`,
                      borderRadius: 8, transition: 'all 0.18s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lol-gold-1)'; e.currentTarget.style.background = 'rgba(200,155,60,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = a.highlight ? 'rgba(249,115,22,0.4)' : 'var(--border-gold)'; e.currentTarget.style.background = a.highlight ? 'rgba(249,115,22,0.08)' : 'rgba(1,10,19,0.6)'; }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: a.highlight ? '#f97316' : 'var(--lol-gold-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--lol-grey-1)', marginTop: 1 }}>{a.sub}</div>
                      </div>
                      <span style={{ color: 'var(--lol-grey-2)', fontSize: 12 }}>›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </Layout>
  );
}
