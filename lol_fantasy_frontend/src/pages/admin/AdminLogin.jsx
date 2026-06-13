import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminApi';

export default function AdminLogin() {
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email:'', password:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminService.login(form);
      if (!res.data.user_id) throw new Error();
      // Étape 2 : envoyer OTP email
      await adminService.chooseOTP({
        user_id: res.data.user_id,
        otp_method: 'email'
      });
      localStorage.setItem('admin_user_id', res.data.user_id);
      navigate('/admin/verify');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">⚙️</span>
          <h1>LoL Fantasy</h1>
          <p>Administration</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email Admin</label>
            <input type="email" name="email" placeholder="admin@lolfantasy.com"
              value={form.email}
              onChange={e => { setForm({...form, email: e.target.value}); setError(''); }}
              required />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" name="password" placeholder="••••••••"
              value={form.password}
              onChange={e => { setForm({...form, password: e.target.value}); setError(''); }}
              required />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Connexion Admin →'}
          </button>
        </form>
      </div>
    </div>
  );
}