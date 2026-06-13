import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QRCodePage() {
  const navigate = useNavigate();
  const qrCode   = localStorage.getItem('qr_code');

  return (
    <div className="auth-container">
      <div className="auth-card qr-card">
        <div className="auth-logo">
          <span className="logo-icon">⚔️</span>
          <h1>LoL Fantasy</h1>
          <p>Configurer la 2FA</p>
        </div>

        <div className="qr-steps">
          <div className="step">
            <span className="step-num">1</span>
            <span>Installe <strong>Google Authenticator</strong> sur ton téléphone</span>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <span>Appuie sur <strong>+</strong> puis <strong>Scanner un QR code</strong></span>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <span>Scanne l'image ci-dessous</span>
          </div>
        </div>

        <div className="qr-wrapper">
          {qrCode ? (
            <img
              src={qrCode}
              alt="QR Code 2FA"
              className="qr-image"
            />
          ) : (
            <p style={{ color: 'var(--text2)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              QR code introuvable. Merci de te réinscrire.
            </p>
          )}
        </div>

        <p className="qr-hint">
          Un code à 6 chiffres apparaît dans l'app, renouvelé toutes les 30 secondes.
        </p>

        <button
          className="btn-primary"
          onClick={() => {
            localStorage.removeItem('qr_code');
            navigate('/login');
          }}
        >
          J'ai scanné le QR code →
        </button>
      </div>
    </div>
  );
}