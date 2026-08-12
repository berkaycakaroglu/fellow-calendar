import React, { useState } from 'react';

export default function Auth({ onLogin }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [message, setMessage] = useState('');

  // Giriş Formu Stateleri
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Kayıt Formu Stateleri
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setMessage('Lütfen tüm alanları doldurun.');
      return;
    }
    // Backend isteği buraya gelecek
    onLogin({ email: loginEmail, name: 'Kullanıcı' });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (registerPassword !== registerPasswordConfirm) {
      setMessage('Şifreler uyuşmuyor!');
      return;
    }
    setMessage('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
    setIsLoginView(true);
  };

  return (
    <div id="auth-screen" className="container">
      <h1>📅 Fellow Calendar</h1>
      <p>Arkadaşlarınla plan yapmanın en kolay yolu.</p>

      {isLoginView ? (
        <div id="giris-formu" className="form-group">
          <h3>Giriş Yap</h3>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="E-Posta Adresi"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Şifre"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button type="submit">Giriş Yap</button>
          </form>
          <p>
            Hesabın yok mu?{' '}
            <a href="#" onClick={() => setIsLoginView(false)}>
              Kayıt Ol
            </a>
          </p>
        </div>
      ) : (
        <div id="kayit-formu" className="form-group">
          <h3>Hesap Oluştur</h3>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="İsim Soyisim"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="E-Posta Adresi"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Şifre (En az 8 kar., 1 Büyük, 1 Özel)"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Şifreyi Tekrar Girin"
              value={registerPasswordConfirm}
              onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
            />
            <button type="submit">Kayıt Ol</button>
          </form>
          <p>
            Zaten hesabın var mı?{' '}
            <a href="#" onClick={() => setIsLoginView(true)}>
              Giriş Yap
            </a>
          </p>
        </div>
      )}

      {message && <p className="mesaj">{message}</p>}
    </div>
  );
}