import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminApi';

export default function AdminVerify() {
  const navigate   = useNavigate();
  const [digits, setDigits]   = useState(['','','','','','']);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < 5) inputs.current[index + 1].focus();
    if (next.every(d => d !== '') && value) handleVerify(next.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputs.current[index - 1].focus();
  };

  const handleVerify = async (code) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.verifyOTP({
        user_id : parseInt(localStorage.getItem('admin_user_id')),
        otp_code: code,
      });
      // Sauvegarde sans vérifier is_staff
      localStorage.setItem('admin_access_token',  res.data.tokens.access);
      localStorage.setItem('admin_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('admin_user',          JSON.stringify(res.data.user));
      navigate('/admin/dashboard');
    } catch {
      setError('Code invalide ou expiré.');
      setDigits(['','','','','','']);
      inputs.current[0]?.focus();
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
          <p>Vérification Admin</p>
        </div>
        <p className="otp-hint">Code OTP envoyé à votre email admin</p>
        <form onSubmit={(e) => { e.preventDefault(); handleVerify(digits.join('')); }}
              className="auth-form">
          <div className="otp-inputs">
            {digits.map((digit, i) => (
              <input key={i} ref={el => inputs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`otp-box ${error ? 'otp-error' : ''}`}
                autoFocus={i === 0} />
            ))}
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn-primary"
            disabled={loading || digits.some(d => d === '')}>
            {loading ? <span className="spinner" /> : 'Vérifier'}
          </button>
        </form>
      </div>
    </div>
  );
}