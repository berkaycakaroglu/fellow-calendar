import React, { useState } from 'react';
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

  // Giriş başarılı olduğunda
  const handleLoginSuccess = (loginResponse) => {
    const sessionData = {
      ...loginResponse.user,
      access_token: loginResponse.access_token
    };
    setUser(sessionData);
    localStorage.setItem('active_user', JSON.stringify(sessionData));
    localStorage.setItem('token', loginResponse.access_token);
  };

  // Çıkış yapıldığında
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('active_user');
    localStorage.removeItem('token');
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
        <SettingsModal
          user={user}
          onClose={() => setIsSettingsOpen(false)}
          onUserUpdated={(updatedData) => {
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            localStorage.setItem('active_user', JSON.stringify(updatedUser));
          }}
        />
      )}
    </div>
  );
}