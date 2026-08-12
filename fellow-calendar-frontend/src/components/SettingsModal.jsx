import React from 'react';

export default function SettingsModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>⚙️ Hesap Ayarları</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>İsim Soyisim</label>
            <input type="text" defaultValue="Berkay Çakaroğlu" />
          </div>

          <div className="form-group">
            <label>E-Posta Adresi</label>
            <input type="email" defaultValue="berkay@example.com" />
          </div>

          <div className="form-group">
            <label>Yeni Şifre</label>
            <input type="password" placeholder="Yeni şifrenizi girin..." />
          </div>

          <button className="btn-primary" style={{ marginTop: '20px' }}>
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}