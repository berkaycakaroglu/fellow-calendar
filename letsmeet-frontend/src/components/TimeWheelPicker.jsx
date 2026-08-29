import React from 'react';
import { Clock } from 'lucide-react';

export default function TimeWheelPicker({ label, hour, minute, onHourChange, onMinuteChange, disabled }) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={15} color="#0057FF" style={{ marginRight: '2px' }} />

        {/* Saat Seçimi */}
        <div style={{ position: 'relative' }}>
          <select
            value={hour}
            onChange={(e) => onHourChange(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: '#FFFFFF',
              border: '1px solid #E6E4DD',
              borderRadius: '8px',
              padding: '8px 24px 8px 12px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#14171F',
              cursor: 'pointer',
              outline: 'none',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            {hours.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px', color: '#949DAE' }}>
            ▼
          </span>
        </div>

        <span style={{ fontWeight: '800', color: '#949DAE', fontSize: '14px' }}>:</span>

        {/* Dakika Seçimi */}
        <div style={{ position: 'relative' }}>
          <select
            value={minute}
            onChange={(e) => onMinuteChange(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: '#FFFFFF',
              border: '1px solid #E6E4DD',
              borderRadius: '8px',
              padding: '8px 24px 8px 12px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#14171F',
              cursor: 'pointer',
              outline: 'none',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px', color: '#949DAE' }}>
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}