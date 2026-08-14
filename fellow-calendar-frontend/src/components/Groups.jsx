import React, { useEffect, useState } from 'react';

export default function Groups({ user, onOpenInvite, onOpenCreateGroup, onOpenJoinGroup, onOpenGroupSettings, refreshTrigger, onFindCommonTime }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${user.id}/groups`);
      if (res.ok) {
        setGroups(await res.json());
      }
    } catch (err) {
      console.error('Gruplar alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user, refreshTrigger]);

  return (
    <div className="card" style={{ height: 'fit-content' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>👥 Gruplarım ({groups.length})</h3>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button className="btn-primary" style={{ flex: 1, padding: '9px 5px', fontSize: '13px' }} onClick={onOpenCreateGroup}>
          + Yeni Grup
        </button>
        <button className="btn-primary" style={{ flex: 1, padding: '9px 5px', fontSize: '13px', backgroundColor: '#4a5568' }} onClick={onOpenJoinGroup}>
          🔗 Gruba Katıl
        </button>
      </div>

      <hr style={{ margin: '12px 0', border: '0', borderTop: '1px solid #edf2f7' }} />

      <div style={{ maxHeight: '310px', overflowY: 'auto', paddingRight: '4px' }}>
        {loading ? (
          <p style={{ fontSize: '13px', color: '#718096' }}>Yükleniyor...</p>
        ) : groups.length === 0 ? (
          <div style={{ border: '2px dashed #cbd5e0', borderRadius: '10px', padding: '24px 15px', textAlign: 'center', background: '#f7fafc', color: '#718096' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏕️</div>
            <strong style={{ display: 'block', fontSize: '14px', color: '#4a5568', marginBottom: '6px' }}>Henüz bir grubun yok.</strong>
            <p style={{ fontSize: '12px', margin: 0 }}>Yeni bir grup kur veya bir davet koduyla katıl!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groups.map((g) => (
              <div key={g.id} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#2d3748', display: 'block' }}>{g.grup_adi}</strong>
                    <span style={{ fontSize: '11px', color: '#718096', display: 'block', marginTop: '2px' }}>
                      👥 {g.uye_sayisi} Üye | Kod: <strong>{g.davet_kodu}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 8px', fontSize: '12px', background: '#edf2f7', color: '#4a5568', border: '1px solid #cbd5e0' }}
                      onClick={() => onOpenInvite(g)}
                      title="Gruba Davet Et"
                    >
                      Davet
                    </button>
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 8px', fontSize: '12px', width: 'auto', backgroundColor: '#38a169' }}
                      onClick={() => onFindCommonTime(g.id, g.grup_adi)}
                      title="Ortak Saat Bul"
                    >
                      Ortak Saat
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 8px', fontSize: '12px', background: '#edf2f7', color: '#4a5568', border: '1px solid #cbd5e0' }}
                      onClick={() => onOpenGroupSettings(g)}
                      title="Grup Ayarları"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}