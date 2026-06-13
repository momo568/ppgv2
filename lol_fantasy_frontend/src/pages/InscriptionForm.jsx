import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function InscriptionForm() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ nom:'', prenom:'', email:'', username:'', message:'' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.demandeInscription(form);
      setSuccess(true);
    } catch (err) {
      console.log('ERREUR COMPLETE:', err);
      console.log('RESPONSE:', err.response);
      console.log('DATA:', err.response?.data);
      console.log('STATUS:', err.response?.status);
      const d = err.response?.data;
      setError(d?.email?.[0] || d?.username?.[0] || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">✅</span>
          <h1>LoL Fantasy</h1>
          <p>Demande envoyée</p>
        </div>
        <div className="success-box">
          <p>Votre demande a bien été reçue.</p>
          <p>L'administrateur va examiner votre dossier et vous envoyer vos identifiants par email.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/login')}>
          Aller à la connexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth:'480px' }}>
        <div className="auth-logo">
          <span className="logo-icon">⚔️</span>
          <h1>LoL Fantasy</h1>
          <p>Demande d'inscription</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div className="input-group">
              <label>Nom</label>
              <input
                type="text"
                name="nom"
                placeholder="Kammoun"
                value={form.nom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Prénom</label>
              <input
                type="text"
                name="prenom"
                placeholder="Oumaima"
                value={form.prenom}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="ton@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Username (Summoner Name)</label>
            <input
              type="text"
              name="username"
              placeholder="summoner_name"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Pourquoi veux-tu rejoindre ? (optionnel)</label>
            <textarea
              name="message"
              placeholder="Parle-nous de toi..."
              value={form.message}
              onChange={handleChange}
              style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px',
                color: 'var(--text)',
                resize: 'vertical',
                minHeight: '80px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Envoyer ma demande'}
          </button>
        </form>

        <p className="auth-link">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}