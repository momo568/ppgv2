import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function Login() {
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email:'', password:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login(form);
      navigate(`/choose-otp/${res.data.user_id}`);
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        'Email ou mot de passe incorrect.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">⚔️</span>
          <h1>LoL Fantasy</h1>
          <p>Connexion</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="ton@email.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Valider →'}
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:'16px', display:'flex', flexDirection:'column', gap:'8px' }}>
          <Link to="/forgot-password" className="link-subtle">Mot de passe oublié ?</Link>
          <p className="auth-link">Pas encore de compte ? <Link to="/inscription">Faire une demande</Link></p>
        </div>
      </div>
    </div>
  );
}