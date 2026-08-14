// App.jsx
import React, { useState} from 'react';
import Navbar from './components/Navbar';
import Calendar from './components/Calendar';
import Auth from './components/Auth';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Giriş başarılı olunca kullanıcıyı kaydet
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('active_user', JSON.stringify(userData));
  };

  // Çıkış yapıldığında oturumu temizle
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('active_user');
  };

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Navbar
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <main style={{ marginTop: '20px' }}>
        <Calendar user={user} />
      </main>

      {isSettingsOpen && (
        <SettingsModal user={user} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}