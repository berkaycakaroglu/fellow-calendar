import React, { useState } from 'react';

export default function GroupSettingsModal({ user, group, onClose, onUpdated, onDeleted }) {
  const [groupName, setGroupName] = useState(group?.grup_adi || '');
  const [description, setDescription] = useState(group?.aciklama || '');
  const [loading, setLoading] = useState(false);

  const isOwner = group?.olusturan_id === user?.id;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isOwner) return alert('Yalnızca grup kurucusu düzenleyebilir.');
    setLoading(true);

    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grup_adi: groupName,
          aciklama: description,
          kullanici_id: user.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        onUpdated();
        onClose();
      } else {
        alert(data.detail || 'Güncellenemedi.');
      }
    } catch {
      alert('Sunucu hatası.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return alert('Yalnızca grup kurucusu silebilir.');
    if (!window.confirm(`"${group.grup_adi}" grubunu tamamen silmek istediğine emin misin?`)) return;

    try {
      const res = await fetch(`/api/groups/${group.id}?kullanici_id=${user.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        onDeleted();
        onClose();
      } else {
        alert(data.detail || 'Silinemedi.');
      }
    } catch {
      alert('Sunucu hatası.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2>⚙️ Grup Ayarları</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleUpdate} className="modal-body">
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Grup Adı</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={!isOwner}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Grup Açıklaması</label>
            <textarea
              rows="3"
              placeholder="Grup hakkında kısa bir açıklama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isOwner}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', resize: 'none' }}
            />
          </div>

          {isOwner ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDelete}
                style={{ width: '100%', padding: '8px', fontSize: '13px' }}
              >
                🗑️ Grubu Tamamen Sil
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#718096', textAlign: 'center' }}>
              Bu grubun yöneticisi değilsiniz. Yalnızca kurucu düzenleyebilir.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}