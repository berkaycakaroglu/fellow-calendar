import React, { useState } from 'react';

export default function JoinGroupModal({ user, onClose, onGroupJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
  const token = user?.access_token || localStorage.getItem('token') || '';

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          token: code.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        if (onGroupJoined) onGroupJoined();
        onClose();
      } else {
        setError(data.detail || 'Gruba katılınamadı.');
      }
    } catch {
      setError('Sunucuyla bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>🔗 Gruba Katıl</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleJoin} className="modal-body">
          {error && (
            <div style={{ padding: '8px', background: '#fed7d7', color: '#9b2c2c', borderRadius: '6px', marginBottom: '12px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Davet Kodu</label>
            <input
              type="text"
              placeholder="Örn: FLW-1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '15px' }} disabled={loading}>
            {loading ? 'Katılınıyor...' : 'Gruba Katıl'}
          </button>
        </form>
      </div>
    </div>
  );
}