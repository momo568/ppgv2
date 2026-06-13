import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function ChooseOTP() {
  const { userId } = useParams();
  const navigate   = useNavigate();
  const [selected, setSelected] = useState('email');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

 const handleContinue = async () => {
    setLoading(true);
    try {
      const res = await authService.chooseOTP({
        user_id: parseInt(userId),
        otp_method: selected,
      });

      if (selected === 'qrcode') {
        localStorage.setItem('qr_code', res.data.qr_code_base64);
      } else {
        // Si email → supprime le QR code du localStorage
        localStorage.removeItem('qr_code');
      }

      navigate(`/verify/${userId}`);
    } catch {
      setError('Erreur. Réessayez.');
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
          <p>Vérification en 2 étapes</p>
        </div>

        <p style={{ color:'var(--text2)', fontSize:'14px', textAlign:'center', marginBottom:'24px' }}>
          Comment voulez-vous recevoir votre code ?
        </p>

        <div className="otp-method-choices">
          <div
            className={`otp-method-card ${selected === 'email' ? 'selected' : ''}`}
            onClick={() => setSelected('email')}
          >
            <span className="method-icon">✉️</span>
            <div>
              <p className="method-title">Utiliser mon e-mail</p>
              <p className="method-desc">Recevoir un code à 6 chiffres par email</p>
            </div>
            <div className={`method-radio ${selected === 'email' ? 'active' : ''}`} />
          </div>

          <div
            className={`otp-method-card ${selected === 'qrcode' ? 'selected' : ''}`}
            onClick={() => setSelected('qrcode')}
          >
            <span className="method-icon">📱</span>
            <div>
              <p className="method-title">Utiliser un QR Code</p>
              <p className="method-desc">Scanner avec Google Authenticator</p>
            </div>
            <div className={`method-radio ${selected === 'qrcode' ? 'active' : ''}`} />
          </div>
        </div>

        {error && <div className="error-box" style={{ marginTop:'16px' }}>{error}</div>}

        <button className="btn-primary" style={{ marginTop:'24px' }}
          onClick={handleContinue} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Continuer'}
        </button>
      </div>
    </div>
  );
}