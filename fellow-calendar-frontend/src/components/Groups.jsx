import React from 'react';

export default function Groups({ onOpenSettings, onOpenInvite, onOpenCreateGroup }) {
  return (
    <div className="right-panel">
      <div className="card">
        <h3>👥 Arkadaş Gruplarım</h3>
        <p>Yeni grup kur veya davet linkiyle bir gruba katıl.</p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={onOpenCreateGroup}
          >
            + Yeni Grup
          </button>

          <button
            className="btn-primary"
            style={{ flex: 1, backgroundColor: '#4a5568' }}
            onClick={onOpenInvite}
          >
            🔗 Davet Et / Ekle
          </button>
        </div>

        <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }} />
        <ul id="grup-listesi" style={{ listStyle: 'none', padding: 0 }}>
          <li>Lise Tayfası (Örnek)</li>
          <li>Halı Saha (Örnek)</li>
        </ul>
      </div>

      <div className="card">
        <h3>⚙️ Hesap Ayarları</h3>
        <p>Profil bilgilerini güncelle.</p>
        <button
          className="btn-secondary"
          style={{ backgroundColor: '#7f8c8d' }}
          onClick={onOpenSettings}
        >
          Ayarlara Git
        </button>
      </div>
    </div>
  );
}