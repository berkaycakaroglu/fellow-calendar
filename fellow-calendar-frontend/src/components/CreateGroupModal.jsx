import React, { useState } from 'react';

export default function CreateGroupModal({ user, onClose, onGroupCreated, onOpenInvite, onOpenSettings }) {
  const [groupName, setGroupName] = useState('');
  const [createdGroup, setCreatedGroup] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
  const token = user?.access_token || localStorage.getItem('token') || '';

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          grup_adi: groupName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const groupObj = {
          id: data.grup_id,
          grup_adi: groupName.trim(),
          davet_kodu: data.davet_kodu,
          uye_sayisi: 1,
          olusturan_id: user?.id
        };
        setCreatedGroup(groupObj);
        if (onGroupCreated) onGroupCreated(groupObj);
      } else {
        alert(data.detail || 'Grup oluşturulamadı.');
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Sunucuyla bağlantı kurulamadı.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div className="modal-header">
          <h2>{createdGroup ? '🎉 Grup Oluşturuldu!' : '➕ Yeni Grup Oluştur'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {!createdGroup ? (
          <form onSubmit={handleCreateGroup} className="modal-body" style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label>Grup Adı</label>
              <input
                type="text"
                placeholder="Örn: Yazılım Ekibi, Halı Saha..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '15px', width: '100%' }}>
              Grubu Kur
            </button>
          </form>
        ) : (
          <div className="modal-body" style={{ paddingTop: '10px' }}>
            <p style={{ color: '#2b6cb0', fontWeight: 'bold', marginBottom: '20px' }}>
              "{groupName}" grubu başarıyla kuruldu. Şimdi ne yapmak istersin?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#3182ce', padding: '12px' }}
                onClick={() => {
                  onClose();
                  if (onOpenInvite) onOpenInvite(createdGroup);
                }}
              >
                🤝 Arkadaşlarını Davet Et
              </button>

              <button
                className="btn-primary"
                style={{ backgroundColor: '#4a5568', padding: '12px' }}
                onClick={() => {
                  onClose();
                  if (onOpenSettings) onOpenSettings(createdGroup);
                }}
              >
                ⚙️ Grup Ayarlarını Düzenle
              </button>

              <button
                className="btn-secondary"
                style={{ marginTop: '5px', backgroundColor: '#edf2f7', color: '#4a5568' }}
                onClick={onClose}
              >
                Tamam, Ana Sayfaya Dön
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}