import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Calendar from '../components/Calendar';
import Groups from '../components/Groups';
import SettingsModal from '../components/SettingsModal';

export default function Dashboard({ user, onLogout }) {
  // Modal'ın açık/kapalı durumunu tutan state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div id="dashboard-screen" style={{ padding: '20px' }}>
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-layout">
        <div className="left-panel card">
          <h3>📅 Kişisel Takvimim</h3>
          <Calendar />
        </div>

        {/* onOpenSettings fonksiyonunu Groups bileşenine yolluyoruz */}
        <Groups onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>

      {/* isSettingsOpen true ise Modal'ı ekranda göster */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}