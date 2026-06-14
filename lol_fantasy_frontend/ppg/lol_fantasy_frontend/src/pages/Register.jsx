import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', username: '', password: '' });
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
      const res = await authService.register(form);
      localStorage.setItem('qr_code', res.data.qr_code_base64);
      navigate(`/qrcode/${res.data.user_id}`);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.email?.[0] || d?.username?.[0] || d?.password?.[0] || "Erreur inscription.");
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
          <p>Créer un compte</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
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
            <label>Username</label>
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
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="8 caractères minimum"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : "S'inscrire"}
          </button>
        </form>
        <p className="auth-link">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}