import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function ForgotPassword() {
  const navigate  = useNavigate();
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Aucun compte trouvé avec cet email.');
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
          <p>Email envoyé</p>
        </div>
        <div className="success-box">
          <p>Un mot de passe temporaire a été envoyé à <strong>{email}</strong>.</p>
          <p>Consultez votre boîte mail et connectez-vous.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/login')}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">🔑</span>
          <h1>LoL Fantasy</h1>
          <p>Mot de passe oublié</p>
        </div>
        <p style={{ color:'var(--text2)', fontSize:'14px', textAlign:'center', marginBottom:'20px' }}>
          Entrez votre adresse e-mail. Un mot de passe temporaire vous sera envoyé.
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Adresse e-mail</label>
            <input type="email" placeholder="ton@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Envoyer'}
          </button>
        </form>
        <p className="auth-link"><Link to="/login">← Retour à la connexion</Link></p>
      </div>
    </div>
  );
}