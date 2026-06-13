import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminApi';

export default function AdminDemandes() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('en_attente');
  const [message, setMessage]   = useState({ text:'', type:'' });

  const clearMessage = () => setMessage({ text:'', type:'' });

  const load = async () => {
    try {
      const res = await adminService.getDemandes();
      setDemandes(res.data);
      setLoading(false);
    } catch {
      navigate('/admin/login');
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { clearMessage(); }, [filter]);

  const approuver = async (id) => {
    clearMessage();
    setLoading(true);
    try {
      const res = await adminService.approuverDemande(id);
      await load();
      setMessage({ text: res.data.message, type: 'success' });
    } catch (err) {
      setLoading(false);
      setMessage({
        text: err.response?.data?.error || 'Erreur.',
        type: 'error'
      });
    }
  };

  const rejeter = async (id) => {
    clearMessage();
    setLoading(true);
    try {
      await adminService.rejeterDemande(id);
      await load();
      setMessage({ text: 'Demande rejetée.', type: 'success' });
    } catch {
      setLoading(false);
      setMessage({ text: 'Erreur.', type: 'error' });
    }
  };

  const filtered = demandes.filter(d =>
    filter === 'all' ? true : d.statut === filter
  );

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">⚙️ Admin Panel</div>
        <Link to="/admin/dashboard" className="btn-logout" style={{ textDecoration:'none' }}>
          ← Retour
        </Link>
      </header>

      <main className="dash-main">
        <div className="welcome-card">
          <h2>Demandes d'inscription</h2>
          <p>Approuvez ou rejetez les demandes des joueurs.</p>
        </div>

        {/* Message feedback */}
        {message.text && (
          <div style={{
            marginBottom: '16px',
            padding: '14px 20px',
            borderRadius: 'var(--r-md)',
            fontSize: '14px',
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            background: message.type === 'success'
              ? 'rgba(61,220,132,0.08)'
              : 'rgba(255,77,77,0.08)',
            border: `1px solid ${message.type === 'success'
              ? 'rgba(61,220,132,0.3)'
              : 'rgba(255,77,77,0.3)'}`,
            color: message.type === 'success' ? '#3ddc84' : '#ff6b6b',
          }}>
            {message.text}
          </div>
        )}

        {/* Filtres */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
          {[
            { key:'all',        label:'Toutes' },
            { key:'en_attente', label:'En attente' },
            { key:'approuvee',  label:'Approuvées' },
            { key:'rejetee',    label:'Rejetées' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding:'8px 18px', borderRadius:'20px', cursor:'pointer',
              fontSize:'12px', letterSpacing:'1px',
              fontFamily:'var(--font-display)',
              background: filter === f.key
                ? 'linear-gradient(135deg, var(--lol-gold-3), var(--lol-gold-2))'
                : 'rgba(1,10,19,0.8)',
              color: filter === f.key ? 'var(--bg-void)' : 'var(--lol-grey-1)',
              border: filter === f.key
                ? '1px solid var(--lol-gold-1)'
                : '1px solid var(--lol-gold-3)',
              fontWeight: filter === f.key ? '700' : '400',
              transition: 'all 0.2s',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px' }}>
            <span className="spinner large" />
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {filtered.length === 0 && (
              <p style={{
                color:'var(--lol-grey-2)', textAlign:'center',
                padding:'60px', fontFamily:'var(--font-display)',
                letterSpacing:'2px',
              }}>
                AUCUNE DEMANDE.
              </p>
            )}
            {filtered.map(d => (
              <div key={d.id} style={{
                background:'rgba(1,10,19,0.85)',
                border:'1px solid var(--lol-gold-3)',
                borderRadius:'var(--r-md)', padding:'20px',
                display:'flex', alignItems:'center',
                justifyContent:'space-between', gap:'16px',
              }}>
                {/* Infos */}
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:'600', fontSize:'16px', color:'var(--lol-gold-light)' }}>
                    {d.prenom} {d.nom}
                  </p>
                  <p style={{ color:'var(--lol-grey-1)', fontSize:'13px', marginTop:'4px' }}>
                    {d.email} · @{d.username}
                  </p>
                  {d.message && (
                    <p style={{ color:'var(--lol-grey-1)', fontSize:'13px', marginTop:'4px', fontStyle:'italic' }}>
                      "{d.message}"
                    </p>
                  )}
                  <p style={{ color:'var(--lol-grey-2)', fontSize:'11px', marginTop:'6px' }}>
                    {d.created_at}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{
                    padding:'4px 12px', borderRadius:'20px',
                    fontSize:'11px', fontWeight:'600',
                    fontFamily:'var(--font-display)', letterSpacing:'1px',
                    background: d.statut === 'en_attente' ? 'rgba(200,170,110,0.12)' :
                                d.statut === 'approuvee'  ? 'rgba(61,220,132,0.12)' :
                                                            'rgba(255,107,107,0.12)',
                    color: d.statut === 'en_attente' ? 'var(--lol-gold-1)' :
                           d.statut === 'approuvee'  ? '#3ddc84' : '#ff6b6b',
                    border: `1px solid ${
                      d.statut === 'en_attente' ? 'rgba(200,170,110,0.3)' :
                      d.statut === 'approuvee'  ? 'rgba(61,220,132,0.3)' :
                                                  'rgba(255,107,107,0.3)'
                    }`,
                  }}>
                    {d.statut === 'en_attente' ? '⏳ En attente' :
                     d.statut === 'approuvee'  ? '✅ Approuvée'  : '❌ Rejetée'}
                  </span>

                  {d.statut === 'en_attente' && (
                    <>
                      <button onClick={() => approuver(d.id)} style={{
                        background:'rgba(61,220,132,0.1)',
                        border:'1px solid rgba(61,220,132,0.4)',
                        color:'#3ddc84', padding:'8px 16px',
                        borderRadius:'var(--r-sm)', cursor:'pointer',
                        fontSize:'11px', fontWeight:'700',
                        fontFamily:'var(--font-display)', letterSpacing:'1px',
                        transition:'all 0.2s',
                      }}>
                        ✅ APPROUVER
                      </button>
                      <button onClick={() => rejeter(d.id)} style={{
                        background:'rgba(255,107,107,0.1)',
                        border:'1px solid rgba(255,107,107,0.4)',
                        color:'#ff6b6b', padding:'8px 16px',
                        borderRadius:'var(--r-sm)', cursor:'pointer',
                        fontSize:'11px', fontWeight:'700',
                        fontFamily:'var(--font-display)', letterSpacing:'1px',
                        transition:'all 0.2s',
                      }}>
                        ❌ REJETER
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}