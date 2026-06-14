import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { managerService } from '../../services/managerApi';

export default function ManagerMembers() {
  const { id } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmails, setInviteEmails] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    managerService.getMembers(id).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleInvite = async (e) => {
    e.preventDefault(); setSending(true); setError(''); setMsg('');
    try {
      const r = await managerService.invite(id, inviteEmails);
      setMsg(`${r.data.sent?.length || 0} invitation(s) envoyée(s) !`);
      setInviteEmails('');
    } catch { setError('Erreur lors de l\'envoi.'); }
    finally { setSending(false); }
  };

  const handleRemove = async (userId, username) => {
    if (!window.confirm(`Retirer ${username} de la ligue ?`)) return;
    try { await managerService.removeMember(id, userId); load(); }
    catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  };

  if (loading) return <Layout><div className="page-loading"><span className="spinner large"/></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">👥 Membres — {data?.league}</h1>
        <Link to="/manager/leagues" style={{ fontSize:12, color:'var(--lol-gold-1)' }}>← Retour</Link>
      </div>

      {/* Code invitation */}
      <div style={{ background:'rgba(200,155,60,0.08)', border:'1px solid rgba(200,155,60,0.25)', borderRadius:10, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--lol-grey-1)', marginBottom:4 }}>CODE D'INVITATION</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:24, color:'var(--lol-gold-1)', letterSpacing:4, fontWeight:700 }}>{data?.code}</div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:12, color:'var(--lol-grey-1)' }}>
          {data?.count} / membres
        </div>
      </div>

      {/* Inviter par email */}
      <div style={{ background:'rgba(4,12,26,0.7)', border:'1px solid var(--border-gold)', borderRadius:10, padding:'16px 18px', marginBottom:20 }}>
        <div style={{ fontWeight:600, color:'var(--lol-gold-light)', marginBottom:10 }}>✉️ Inviter par email</div>
        <form onSubmit={handleInvite} style={{ display:'flex', gap:10 }}>
          <input
            className="chat-input"
            style={{ flex:1 }}
            placeholder="email1@ex.com, email2@ex.com, ..."
            value={inviteEmails}
            onChange={e => setInviteEmails(e.target.value)}
          />
          <button type="submit" className="btn-gold" disabled={sending}>
            {sending ? <span className="spinner"/> : 'Envoyer'}
          </button>
        </form>
        {msg   && <div className="success-box" style={{ marginTop:8 }}>{msg}</div>}
        {error && <div className="error-box"   style={{ marginTop:8 }}>{error}</div>}
      </div>

      {/* Liste membres */}
      <div className="table-wrap">
        {(data?.members || []).map((m, i) => (
          <div key={m.user_id} className="rank-row">
            <div className={`rank-num ${i===0?'gold':i===1?'silver':i===2?'bronze':''}`}>{i+1}</div>
            <div className="rank-username">{m.username}</div>
            <div style={{ fontSize:11, color:'var(--lol-grey-1)' }}>{m.email}</div>
            <div style={{ fontSize:11, color: m.role==='manager'?'var(--lol-gold-1)':'var(--lol-grey-2)', fontWeight: m.role==='manager'?700:400 }}>
              {m.role==='manager'?'👑 Manager':'Membre'}
            </div>
            <div style={{ fontSize:11, color: m.roster_complete?'#27ae60':'var(--lol-grey-2)' }}>
              {m.roster_complete?'✅ Roster':'⏳ Incomplet'} ({m.roster_slots}/5)
            </div>
            <div className="rank-points">{m.total_points} pts</div>
            {m.role !== 'manager' && (
              <button onClick={() => handleRemove(m.user_id, m.username)}
                style={{ padding:'3px 10px', fontSize:11, background:'rgba(231,76,60,0.12)', color:'#e74c3c', border:'1px solid rgba(231,76,60,0.3)', borderRadius:5, cursor:'pointer' }}>
                ✕
              </button>
            )}
          </div>
        ))}
        {(!data?.members || data.members.length === 0) && (
          <div style={{ textAlign:'center', padding:24, color:'var(--lol-grey-1)', fontSize:13 }}>Aucun membre pour l'instant.</div>
        )}
      </div>
    </Layout>
  );
}
