import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { matchService } from '../services/api';

const LEAGUES = ['LEC', 'LCK', 'LCS', 'LPL'];

const LEAGUE_FLAGS = { LEC: '🇪🇺', LCK: '🇰🇷', LCS: '🇺🇸', LPL: '🇨🇳' };

function TeamLogo({ team }) {
  const [err, setErr] = useState(false);
  if (team.image && !err)
    return <img src={team.image} alt={team.code} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={() => setErr(true)} />;
  return (
    <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,var(--lol-gold-3),var(--lol-blue-3))', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--lol-gold-light)', fontFamily: 'var(--font-display)' }}>
      {(team.code || '?')[0]}
    </div>
  );
}

function RankMedal({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>;
  return <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--lol-grey-2)', width: 28, display: 'inline-block', textAlign: 'center' }}>{rank}</span>;
}

function StandingsTable({ rankings }) {
  if (!rankings || rankings.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--lol-grey-1)', fontSize: 13 }}>Pas encore de classement disponible.</div>;

  return (
    <div className="table-wrap">
      <table className="lol-table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th>Équipe</th>
            <th style={{ textAlign: 'center' }}>V</th>
            <th style={{ textAlign: 'center' }}>D</th>
            <th style={{ textAlign: 'center' }}>Win%</th>
            <th>
              <div style={{ height: 4, background: 'linear-gradient(90deg, var(--lol-green), #666)', borderRadius: 2, width: '100%' }} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rankings.map(rk =>
            rk.teams.map(team => {
              const total  = team.wins + team.losses;
              const pct    = total > 0 ? Math.round((team.wins / total) * 100) : 0;
              const barPct = total > 0 ? (team.wins / total) * 100 : 0;
              return (
                <tr key={team.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ textAlign: 'center' }}>
                    <RankMedal rank={rk.ordinal} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <TeamLogo team={team} />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--lol-gold-light)', fontSize: 14 }}>{team.code}</div>
                        <div style={{ fontSize: 11, color: 'var(--lol-grey-1)' }}>{team.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--lol-green)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 16 }}>{team.wins}</td>
                  <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 16 }}>{team.losses}</td>
                  <td style={{ textAlign: 'center', color: 'var(--lol-gold-1)', fontSize: 13 }}>{pct}%</td>
                  <td style={{ minWidth: 100 }}>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: `linear-gradient(90deg, var(--lol-green), var(--lol-gold-2))`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function BracketMatch({ m }) {
  const win1 = m.team1.outcome === 'win';
  const win2 = m.team2.outcome === 'win';
  const done = m.state === 'completed';

  return (
    <div style={{ background: 'rgba(1,10,19,0.9)', border: `1px solid ${done ? 'rgba(200,170,110,0.3)' : 'var(--border-gold)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 8, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: win1 ? 'var(--lol-gold-light)' : win2 ? 'var(--lol-grey-2)' : 'var(--lol-gold-light)' }}>
          {win1 && '🏆 '}{m.team1.code}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--lol-gold-1)', padding: '0 8px' }}>
          {done ? m.team1.wins : '·'}
        </span>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: win2 ? 'var(--lol-gold-light)' : win1 ? 'var(--lol-grey-2)' : 'var(--lol-gold-light)' }}>
          {win2 && '🏆 '}{m.team2.code}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--lol-gold-1)', padding: '0 8px' }}>
          {done ? m.team2.wins : '·'}
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--lol-grey-2)', textAlign: 'right' }}>
        {done ? '✅ Terminé' : m.state === 'inProgress' ? '🔴 En direct' : `BO${m.strategy}`}
      </div>
    </div>
  );
}

export default function Tournaments() {
  const [league, setLeague]             = useState('LEC');
  const [tournaments, setTournaments]   = useState([]);
  const [selectedTournament, setSel]    = useState(null);
  const [standings, setStandings]       = useState(null);
  const [loadingTours, setLoadingTours] = useState(false);
  const [loadingStands, setLoadingStands] = useState(false);
  const [activeStage, setActiveStage]   = useState(0);

  const loadTournaments = (lg) => {
    setLoadingTours(true);
    setStandings(null);
    setSel(null);
    matchService.tournaments(lg)
      .then(r => {
        const tours = r.data.tournaments || [];
        setTournaments(tours);
        if (tours.length > 0) {
          const latest = tours[0];
          setSel(latest);
          loadStandings(latest.id);
        }
      })
      .finally(() => setLoadingTours(false));
  };

  const loadStandings = (tid) => {
    setLoadingStands(true);
    setActiveStage(0);
    matchService.standings(tid)
      .then(r => setStandings(r.data.standings || []))
      .finally(() => setLoadingStands(false));
  };

  useEffect(() => { loadTournaments('LEC'); }, []);

  const handleLeague = (lg) => {
    setLeague(lg);
    loadTournaments(lg);
  };

  const stages = standings?.[0]?.stages || [];
  const currentStage = stages[activeStage];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🏆 Tournois</h1>
      </div>

      {/* Sélection ligue */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {LEAGUES.map(lg => (
          <button
            key={lg}
            onClick={() => handleLeague(lg)}
            style={{
              padding: '10px 22px',
              background: league === lg ? 'linear-gradient(135deg,var(--lol-gold-3),var(--lol-gold-4))' : 'rgba(1,10,19,0.8)',
              border: `1px solid ${league === lg ? 'var(--lol-gold-1)' : 'var(--lol-gold-3)'}`,
              borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              letterSpacing: 2, color: league === lg ? 'var(--lol-gold-light)' : 'var(--lol-grey-1)',
              transition: 'all 0.2s',
              boxShadow: league === lg ? '0 0 16px rgba(200,155,60,0.2)' : 'none',
            }}
          >
            {LEAGUE_FLAGS[lg]} {lg}
          </button>
        ))}
      </div>

      {loadingTours ? (
        <div className="page-loading"><span className="spinner large" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Liste des tournois */}
          <div>
            <div className="section-title">Saisons</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tournaments.slice(0, 8).map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSel(t); loadStandings(t.id); }}
                  style={{
                    background: selectedTournament?.id === t.id ? 'rgba(200,155,60,0.12)' : 'rgba(1,10,19,0.7)',
                    border: `1px solid ${selectedTournament?.id === t.id ? 'var(--lol-gold-2)' : 'var(--border-gold)'}`,
                    borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.18s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lol-gold-light)' }}>
                    {t.slug?.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) || t.id}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--lol-grey-2)', marginTop: 3 }}>
                    {formatDate(t.startDate)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Standings du tournoi sélectionné */}
          <div>
            {selectedTournament && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--lol-gold-light)', marginBottom: 4 }}>
                  {LEAGUE_FLAGS[league]} {league} · {selectedTournament.slug?.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>
                  {formatDate(selectedTournament.startDate)} → {formatDate(selectedTournament.endDate)}
                </div>
              </div>
            )}

            {loadingStands ? (
              <div className="page-loading"><span className="spinner large" /></div>
            ) : stages.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📊</span>
                <p>Aucun classement disponible pour ce tournoi.</p>
              </div>
            ) : (
              <>
                {/* Onglets stages */}
                <div className="tabs" style={{ marginBottom: 20 }}>
                  {stages.map((s, i) => (
                    <button
                      key={i}
                      className={`tab ${activeStage === i ? 'active' : ''}`}
                      onClick={() => setActiveStage(i)}
                    >
                      {i === 0 ? '📋' : '⚔️'} {s.name}
                    </button>
                  ))}
                </div>

                {currentStage && currentStage.sections.map((sec, si) => (
                  <div key={si} style={{ marginBottom: 28 }}>
                    {sec.name && sec.name !== currentStage.name && (
                      <div className="section-title" style={{ marginBottom: 14 }}>{sec.name}</div>
                    )}

                    {/* Classement régulier */}
                    {sec.rankings.length > 0 && <StandingsTable rankings={sec.rankings} />}

                    {/* Brackets playoffs */}
                    {sec.matches.length > 0 && (
                      <>
                        {sec.rankings.length === 0 && (
                          <div className="section-title" style={{ marginBottom: 14 }}>Résultats</div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {sec.matches.map((m, mi) => <BracketMatch key={mi} m={m} />)}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
