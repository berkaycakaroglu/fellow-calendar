import React from 'react';

export default function Groups({ onOpenSettings }) {
  return (
    <div className="right-panel">
      <div className="card">
        <h3>👥 Arkadaş Gruplarım</h3>
        <p>Yeni grup kur veya davet linkiyle bir gruba katıl.</p>
        <button
          className="btn-primary"
          onClick={() => alert('Yeni grup kurma penceresi açılacak')}
        >
          + Yeni Grup Kur
        </button>
        <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }} />
        <ul id="grup-listesi" style={{ listStyle: 'none', padding: 0 }}>
          <li>Lise Tayfası (Örnek)</li>
          <li>Halı Saha (Örnek)</li>
        </ul>
      </div>

      <div className="card">
        <h3>⚙️ Hesap Ayarları</h3>
        <p>Profil bilgilerini güncelle.</p>
        {/* Butona tıklandığında gelen prop'u çalıştır */}
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