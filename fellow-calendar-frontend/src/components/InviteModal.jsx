import React, { useState, useEffect } from 'react';

export default function InviteModal({ user, group, defaultInviteCode, onClose }) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' veya 'link'
  const [friends, setFriends] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const inviteLink = defaultInviteCode
    ? `http://localhost:5173/join/${defaultInviteCode}`
    : 'Kod bulunamadı.';

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/users/${user.id}/friends`);
        if (res.ok) {
          const data = await res.json();
          setFriends(data.arkadaslar || []);
        }
      } catch (err) {
        console.error('Arkadaşlar çekilemedi:', err);
      }
    };
    fetchFriends();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultInviteCode || inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteFriend = async (friendId) => {
    if (!group?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/groups/invite-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grup_id: group.id,
          gonderen_id: user.id,
          davet_edilen_id: friendId
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ ${data.detail || 'Davet iletilemedi.'}`);
      }
    } catch {
      alert('Sunucu hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>📩 "{group?.grup_adi || 'Grup'}" Daveti</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
          <button
            className="btn-primary"
            style={{
              flex: 1,
              backgroundColor: activeTab === 'friends' ? '#3182ce' : '#edf2f7',
              color: activeTab === 'friends' ? '#fff' : '#4a5568',
              border: '1px solid #cbd5e0',
              padding: '8px'
            }}
            onClick={() => setActiveTab('friends')}
          >
            👥 Arkadaşlarımdan Seç
          </button>
          <button
            className="btn-primary"
            style={{
              flex: 1,
              backgroundColor: activeTab === 'link' ? '#3182ce' : '#edf2f7',
              color: activeTab === 'link' ? '#fff' : '#4a5568',
              border: '1px solid #cbd5e0',
              padding: '8px'
            }}
            onClick={() => setActiveTab('link')}
          >
            🔗 Davet Kodu / Linki
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'friends' && (
            <div>
              <p style={{ fontSize: '13px', color: '#718096', marginBottom: '10px' }}>
                Ekli arkadaşlarını doğrudan bu gruba davet edebilirsin:
              </p>

              {friends.length === 0 ? (
                <div style={{ padding: '15px', textAlign: 'center', background: '#f7fafc', borderRadius: '8px', color: '#718096', fontSize: '13px' }}>
                  Henüz arkadaş listen boş. Sol panelden arkadaş ekleyebilirsin!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {friends.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '13px' }}>{f.isim}</strong>
                        <span style={{ fontSize: '11px', color: '#718096', display: 'block' }}>@{f.kullanici_adi}</span>
                      </div>
                      <button
                        onClick={() => handleInviteFriend(f.id)}
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: 'auto', padding: '5px 12px', fontSize: '12px' }}
                      >
                        Davet Et
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'link' && (
            <div>
              <p style={{ fontSize: '13px', color: '#718096', marginBottom: '10px' }}>
                Bu davet kodunu kopyalayıp arkadaşına gönderebilirsin:
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={defaultInviteCode || ''}
                  style={{ flex: 1, padding: '9px', fontWeight: 'bold', letterSpacing: '1px', background: '#f7fafc' }}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-primary"
                  style={{ width: 'auto', backgroundColor: copied ? '#38a169' : '#3182ce' }}
                >
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}