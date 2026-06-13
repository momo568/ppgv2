import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function OTPVerify() {
  const { userId } = useParams();
  const navigate   = useNavigate();
  const qrCode     = localStorage.getItem('qr_code');
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
    try {
      const res = await authService.verifyOTP({
        user_id : parseInt(userId),
        otp_code: code,
      });
      localStorage.setItem('access_token',  res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      localStorage.setItem('user',          JSON.stringify(res.data.user));
      localStorage.removeItem('qr_code');

      if (res.data.user.must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Code invalide ou expiré. Réessayez.');
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
          <span className="logo-icon">🔐</span>
          <h1>LoL Fantasy</h1>
          <p>Vérification 2FA</p>
        </div>

        {qrCode && (
          <div className="qr-wrapper" style={{ marginBottom:'16px' }}>
            <img src={qrCode} alt="QR Code" className="qr-image" />
            <p style={{ color:'var(--text2)', fontSize:'12px', textAlign:'center', marginTop:'8px' }}>
              Scannez puis entrez le code
            </p>
          </div>
        )}

        <p className="otp-hint">Entrez le code à 6 chiffres</p>

        <form
          onSubmit={(e) => { e.preventDefault(); handleVerify(digits.join('')); }}
          className="auth-form"
        >
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

        <p className="auth-link" style={{ cursor:'pointer' }}
           onClick={() => navigate('/login')}>← Retour</p>
      </div>
    </div>
  );
}