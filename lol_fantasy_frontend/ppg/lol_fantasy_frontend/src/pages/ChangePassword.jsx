import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ old_password:'', new_password:'' });
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
      await authService.changePassword(form);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.must_change_password = false;
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">🔒</span>
          <h1>LoL Fantasy</h1>
          <p>Changer le mot de passe</p>
        </div>
        <div className="info-box">
          ⚠️ Vous utilisez un mot de passe temporaire. Veuillez en définir un nouveau.
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Mot de passe temporaire</label>
            <input type="password" name="old_password"
              placeholder="Mot de passe reçu par email"
              value={form.old_password} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Nouveau mot de passe</label>
            <input type="password" name="new_password"
              placeholder="8 caractères minimum"
              value={form.new_password} onChange={handleChange} required />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Confirmer'}
          </button>
        </form>
      </div>
    </div>
  );
}