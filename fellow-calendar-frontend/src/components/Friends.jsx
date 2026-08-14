import React, { useState, useEffect } from 'react';

export default function Friends({ user, onGroupAction }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [friendUsername, setFriendUsername] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupRequests, setGroupRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const totalRequests = (friendRequests?.length || 0) + (groupRequests?.length || 0);

  const fetchFriendsData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${user.id}/friends`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data.arkadaslar || []);
        setFriendRequests(data.istekler || []);
        setGroupRequests(data.grup_istekleri || []);
      }
    } catch (err) {
      console.error('Arkadaş/Grup verileri alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, [user]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gonderen_id: user?.id,
          hedef_kullanici_adi: friendUsername.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${data.message}`);
        setFriendUsername('');
        fetchFriendsData();
      } else {
        setMessage(`❌ ${data.detail || 'İstek gönderilemedi.'}`);
      }
    } catch {
      setMessage('❌ Sunucuyla bağlantı kurulamadı.');
    }
  };

  const handleRespondFriend = async (istekId, kabulMu) => {
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ istek_id: istekId, kabul_mu: kabulMu }),
      });
      if (res.ok) fetchFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespondGroup = async (davetId, kabulMu) => {
    try {
      const res = await fetch('/api/groups/respond-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ davet_id: davetId, kabul_mu: kabulMu }),
      });
      if (res.ok) {
        fetchFriendsData();
        if (onGroupAction) onGroupAction();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card" style={{ height: 'fit-content', padding: '16px' }}>
      {/* Üst Sekmeler */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <button
          className="btn-primary"
          style={{
            flex: 1,
            padding: '7px 4px',
            fontSize: '12px',
            backgroundColor: activeTab === 'friends' ? '#3182ce' : '#edf2f7',
            color: activeTab === 'friends' ? '#fff' : '#4a5568',
            border: '1px solid #cbd5e0',
          }}
          onClick={() => setActiveTab('friends')}
        >
          👥 Arkadaşlar ({friends.length})
        </button>

        <button
          className="btn-primary"
          style={{
            flex: 1,
            padding: '7px 4px',
            fontSize: '12px',
            backgroundColor: activeTab === 'requests' ? '#3182ce' : '#edf2f7',
            color: activeTab === 'requests' ? '#fff' : '#4a5568',
            border: '1px solid #cbd5e0',
          }}
          onClick={() => setActiveTab('requests')}
        >
          📩 İstekler ({totalRequests})
        </button>
      </div>

      <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="@kullanıcı_adı ile ekle"
          value={friendUsername}
          onChange={(e) => setFriendUsername(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '13px' }}
        />
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '7px', fontSize: '12px' }}>
          Arkadaş Ekle
        </button>
      </form>

      {message && (
        <div style={{ fontSize: '12px', padding: '6px', background: '#f7fafc', borderRadius: '6px', marginBottom: '10px', border: '1px solid #edf2f7' }}>
          {message}
        </div>
      )}

      <hr style={{ border: '0', borderTop: '1px solid #edf2f7', margin: '10px 0' }} />

      {/* SEKME 1: ARKADAŞLAR */}
      {activeTab === 'friends' && (
        <div>
          {loading ? (
            <p style={{ fontSize: '12px', color: '#718096' }}>Yükleniyor...</p>
          ) : friends.length === 0 ? (
            <div style={{ border: '2px dashed #cbd5e0', borderRadius: '8px', padding: '20px 10px', textAlign: 'center', background: '#f7fafc', color: '#718096' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🤝</div>
              <strong style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '4px' }}>
                Şu an hiç arkadaşın yok.
              </strong>
              <p style={{ fontSize: '11px', margin: 0 }}>Yukarıdan kullanıcı adı yazıp arkadaşlarına davet at!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {friends.map((friend) => (
                <div key={friend.id} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#3182ce', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                    {friend.isim.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block', color: '#2d3748' }}>{friend.isim}</strong>
                    <span style={{ fontSize: '11px', color: '#718096' }}>@{friend.kullanici_adi}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEKME 2: GELEN İSTEKLER (ARKADAŞLIK + GRUP DAVETLERİ) */}
      {activeTab === 'requests' && (
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {totalRequests === 0 ? (
            <div style={{ border: '2px dashed #cbd5e0', borderRadius: '8px', padding: '20px 10px', textAlign: 'center', background: '#f7fafc', color: '#718096' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📭</div>
              <strong style={{ display: 'block', fontSize: '13px', color: '#4a5568' }}>Bekleyen istek yok</strong>
            </div>
          ) : (
            <>
              {/* Arkadaşlık İstekleri */}
              {friendRequests.map((req) => (
                <div key={`fr-${req.istek_id}`} style={{ background: '#ebf8ff', padding: '8px', borderRadius: '6px', border: '1px solid #bee3f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', background: '#3182ce', color: '#fff', padding: '2px 5px', borderRadius: '4px' }}>Arkadaşlık</span>
                    <strong style={{ fontSize: '12px', display: 'block', color: '#2b6cb0', marginTop: '2px' }}>{req.isim}</strong>
                    <span style={{ fontSize: '11px', color: '#718096' }}>@{req.kullanici_adi}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleRespondFriend(req.istek_id, true)} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>✓</button>
                    <button onClick={() => handleRespondFriend(req.istek_id, false)} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                  </div>
                </div>
              ))}

              {/* Grup Davetleri */}
              {groupRequests.map((gd) => (
                <div key={`gr-${gd.davet_id}`} style={{ background: '#fefcbf', padding: '8px', borderRadius: '6px', border: '1px solid #faf089', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', background: '#d69e2e', color: '#fff', padding: '2px 5px', borderRadius: '4px' }}>Grup Daveti</span>
                    <strong style={{ fontSize: '12px', display: 'block', color: '#744210', marginTop: '2px' }}>{gd.grup_adi}</strong>
                    <span style={{ fontSize: '11px', color: '#718096', display: 'block' }}>Gönderen: {gd.gonderen_isim}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleRespondGroup(gd.davet_id, true)} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }} title="Katıl">✓</button>
                    <button onClick={() => handleRespondGroup(gd.davet_id, false)} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }} title="Reddet">✕</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}