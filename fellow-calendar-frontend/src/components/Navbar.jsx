import React from 'react';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <h2>Hoş Geldin, {user?.name || 'Kullanıcı'}!</h2>
      <button onClick={onLogout} className="btn-secondary">
        Çıkış Yap
      </button>
    </nav>
  );
}