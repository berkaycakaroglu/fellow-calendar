import React, { useState } from 'react';

export default function InviteModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('addFriend'); // 'addFriend' veya 'groupInvite'
  const [friendUsername, setFriendUsername] = useState('');
  const [copied, setCopied] = useState(false);

  // Örnek grup davet linki (Backend dinamik davet kodu ürettiğinde burayı güncelleyeceğiz)
  const inviteLink = "http://localhost:5173/join/FLW-892341";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kullanici_adi: friendUsername }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setFriendUsername('');
      } else {
        alert(data.detail || 'Bir hata oluştu.');
      }
    } catch (error) {
      console.error('İstek hatası:', error);
      alert('Sunucuyla bağlantı kurulamadı.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🤝 Davet Et & Arkadaş Ekle</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Sekme Butonları */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            className={`btn-primary ${activeTab === 'addFriend' ? '' : 'btn-secondary'}`}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'addFriend' ? '#3182ce' : '#e2e8f0',
              color: activeTab === 'addFriend' ? '#fff' : '#4a5568'
            }}
            onClick={() => setActiveTab('addFriend')}
          >
            Arkadaş Ekle
          </button>
          <button
            className={`btn-primary ${activeTab === 'groupInvite' ? '' : 'btn-secondary'}`}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'groupInvite' ? '#3182ce' : '#e2e8f0',
              color: activeTab === 'groupInvite' ? '#fff' : '#4a5568'
            }}
            onClick={() => setActiveTab('groupInvite')}
          >
            Grup Davet Linki
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'addFriend' ? (
            <form onSubmit={handleSendFriendRequest}>
              <div className="form-group">
                <label>Kullanıcı Adı ile Ara</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px' }}>
                  <span style={{ color: '#7f8c8d', fontWeight: 'bold', marginRight: '5px' }}>@</span>
                  <input
                    type="text"
                    placeholder="kullaniciadi"
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>
                İstek Gönder
              </button>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '15px' }}>
                Bu davet linkini arkadaşlarınla paylaşarak onları gruba doğrudan davet edebilirsin.
              </p>
              <div className="form-group">
                <label>Grup Davet Bağlantısı</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    style={{ flex: 1, backgroundColor: '#edf2f7', cursor: 'pointer' }}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn-primary"
                    style={{ minWidth: '90px', backgroundColor: copied ? '#38a169' : '#3182ce' }}
                  >
                    {copied ? 'Kopyalandı!' : 'Kopyala'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}