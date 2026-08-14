import React from 'react';
import { Calendar, Settings, LogOut } from 'lucide-react';
import LiveClockWeather from './LiveClockWeather';

export default function Navbar({ user, onOpenSettings, onLogout }) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        border: '1px solid #E6E4DD',
        borderRadius: '16px',
        padding: '12px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}
    >
      {/* Sol: LetsMeet Marka & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            background: '#0057FF',
            color: '#FFFFFF',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 87, 255, 0.3)'
          }}
        >
          <Calendar size={18} />
        </div>
        <h1
          style={{
            fontSize: '17px',
            fontWeight: '800',
            color: '#14171F',
            margin: 0,
            letterSpacing: '-0.02em'
          }}
        >
          Lets<span style={{ color: '#0057FF' }}>Meet</span>
        </h1>
      </div>

      {/* Sağ: Canlı Saat & Hava Durumu + Kullanıcı Aksiyonları */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Canlı Saat & Global Hava Durumu Rozeti */}
        <LiveClockWeather />

        {/* Profil / Ayarlar Butonu */}
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#F8F7F4',
            border: '1px solid #E6E4DD',
            padding: '7px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#14171F',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#ECEAE3')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#F8F7F4')}
        >
          <Settings size={14} color="#5E6678" />
          <span>{user?.isim || 'Hesabım'}</span>
        </button>

        {/* Çıkış Yap Butonu */}
        <button
          onClick={onLogout}
          style={{
            background: '#FEECEB',
            border: '1px solid rgba(229,57,53,0.2)',
            color: '#E53935',
            padding: '7px 10px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E53935';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FEECEB';
            e.currentTarget.style.color = '#E53935';
          }}
          title="Çıkış Yap"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}