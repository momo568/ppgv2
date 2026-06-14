import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { managerService } from '../../services/managerApi';

export default function ManagerInvite() {
  const [leagues, setLeagues]     = useState([]);
  const [selId, setSelId]         = useState('');
  const [emails, setEmails]       = useState('');
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [history, setHistory]     = useState([]);

  useEffect(() => {
    managerService.getLeagues().then(r => {
      setLeagues(r.data);
      if (r.data.length === 1) setSelId(String(r.data[0].id));
    });
  }, []);

  const selected = leagues.find(l => String(l.id) === selId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selId)    { setError('Sélectionne une ligue.'); return; }
    if (!emails.trim()) { setError('Entre au moins un email.'); return; }
    setSending(true); setError(''); setResult(null);
    try {
      const r = await managerService.invite(selId, emails);
      setResult(r.data);
      setHistory(prev => [{ league: selected?.name, emails: r.data.sent, date: new Date().toLocaleTimeString('fr-FR') }, ...prev.slice(0, 9)]);
      setEmails('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi.');
    } finally {
      setSending(false);
    }
  };

  const addEmail = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
      e.preventDefault();
      const val = e.target.value.replace(',','').trim();
      setEmails(prev => prev ? `${prev}, ${val}` : val);
      e.target.value = '';
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">✉️ Inviter des participants</h1>
        <Link to="/manager/dashboard" style={{ fontSize:12, color:'var(--lol-gold-1)' }}>← Dashboard</Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

        {/* ── Formulaire ── */}
        <div>
          <div style={{ background:'rgba(4,12,26,0.8)', border:'1px solid var(--border-gold)', borderRadius:14, padding:'24px 22px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, color:'var(--lol-gold-light)', marginBottom:20 }}>
              Envoyer des invitations
            </div>

            <form onSubmit={handleSend}>
              {/* Sélection ligue */}
              <div className="input-group" style={{ marginBottom:18 }}>
                <label>Ligue</label>
                <select className="filter-select" style={{ width:'100%' }} value={selId}
                  onChange={e => setSelId(e.target.value)}>
                  <option value="">— Choisir une ligue —</option>
                  {leagues.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.is_private ? '🔒' : '🌍'} {l.name} ({l.member_count}/{l.max_members})
                    </option>
                  ))}
                </select>
              </div>

              {/* Code d'invitation affiché */}
              {selected && (
                <div style={{ background:'rgba(200,155,60,0.08)', border:'1px solid rgba(200,155,60,0.25)', borderRadius:8, padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--lol-grey-1)', letterSpacing:1, marginBottom:3 }}>CODE D'INVITATION</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--lol-gold-1)', letterSpacing:4, fontWeight:700 }}>
                      {selected.invite_code}
                    </div>
                  </div>
                  <button type="button" onClick={() => navigator.clipboard.writeText(selected.invite_code)}
                    style={{ fontSize:11, padding:'5px 12px', background:'rgba(200,155,60,0.12)', color:'var(--lol-gold-1)', border:'1px solid var(--lol-gold-3)', borderRadius:6, cursor:'pointer' }}>
                    📋 Copier
                  </button>
                </div>
              )}

              {/* Emails */}
              <div className="input-group" style={{ marginBottom:8 }}>
                <label>Adresses email <span style={{ color:'var(--lol-grey-2)', fontWeight:400 }}>(séparées par virgule)</span></label>
                <textarea
                  className="chat-input"
                  style={{ width:'100%', minHeight:100, resize:'vertical', fontFamily:'monospace', fontSize:13 }}
                  placeholder="joueur1@email.com, joueur2@email.com, joueur3@email.com"
                  value={emails}
                  onChange={e => setEmails(e.target.value)}
                />
              </div>

              <div style={{ fontSize:11, color:'var(--lol-grey-2)', marginBottom:18 }}>
                💡 Chaque invité recevra le code <strong style={{ color:'var(--lol-gold-1)' }}>{selected?.invite_code || '—'}</strong> et les instructions de connexion.
              </div>

              {error  && <div className="error-box"   style={{ marginBottom:12 }}>{error}</div>}

              {result && (
                <div className="success-box" style={{ marginBottom:12 }}>
                  <div style={{ fontWeight:700, marginBottom:4 }}>✅ {result.sent?.length || 0} invitation(s) envoyée(s) !</div>
                  {result.sent?.length > 0 && (
                    <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>
                      {result.sent.join(' · ')}
                    </div>
                  )}
                  {result.skipped?.length > 0 && (
                    <div style={{ fontSize:11, color:'#e74c3c', marginTop:4 }}>
                      ⚠️ Échec: {result.skipped.map(s => s.email).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={sending || !selId}>
                {sending ? <span className="spinner"/> : '✉️ Envoyer les invitations'}
              </button>
            </form>
          </div>

          {/* Ligues disponibles */}
          {leagues.length > 0 && (
            <div style={{ background:'rgba(4,12,26,0.6)', border:'1px solid var(--border-gold)', borderRadius:12, padding:'16px 18px', marginTop:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--lol-gold-1)', marginBottom:10 }}>Mes ligues</div>
              {leagues.map(l => (
                <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <span style={{ fontSize:12, color:'var(--lol-gold-light)', fontWeight:600 }}>{l.is_private?'🔒 ':'🌍 '}{l.name}</span>
                    <span style={{ fontSize:11, color:'var(--lol-grey-2)', marginLeft:8 }}>{l.member_count}/{l.max_members} membres</span>
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--lol-gold-1)', letterSpacing:2 }}>{l.invite_code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Historique des invitations ── */}
        <div>
          <div style={{ background:'rgba(4,12,26,0.8)', border:'1px solid var(--border-gold)', borderRadius:14, padding:'24px 22px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, color:'var(--lol-gold-light)', marginBottom:20 }}>
              Historique d'envoi
              <span style={{ fontSize:11, color:'var(--lol-grey-2)', marginLeft:8, fontFamily:'Inter,sans-serif' }}>(session en cours)</span>
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--lol-grey-2)', fontSize:13 }}>
                <div style={{ fontSize:28, marginBottom:12 }}>✉️</div>
                Aucune invitation envoyée encore.<br/>
                Remplis le formulaire pour commencer.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, color:'var(--lol-gold-light)', fontWeight:600 }}>{h.league}</span>
                      <span style={{ fontSize:10, color:'var(--lol-grey-2)' }}>{h.date}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>
                      ✅ {h.emails.length} envoyé{h.emails.length > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize:10, color:'var(--lol-grey-2)', marginTop:3, wordBreak:'break-all' }}>
                      {h.emails.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div style={{ background:'rgba(52,152,219,0.06)', border:'1px solid rgba(52,152,219,0.2)', borderRadius:12, padding:'16px 18px', marginTop:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#3498db', marginBottom:10 }}>📋 Ce que reçoit le participant</div>
            <div style={{ fontSize:12, color:'var(--lol-grey-1)', lineHeight:1.7 }}>
              L'email contient :<br/>
              • Le nom de ta ligue<br/>
              • Le code d'invitation<br/>
              • Les instructions pour rejoindre<br/>
              • Le budget disponible<br/>
              • L'URL de connexion
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
