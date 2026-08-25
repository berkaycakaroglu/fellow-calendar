import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State'leri
  const [isim, setIsim] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    setTimeout(() => {
      if (isLogin) {
        // Mock Başarılı Giriş
        onLoginSuccess({
          access_token: 'mock-jwt-token-demo-2026',
          user: {
            id: 1,
            isim: 'Berkay Çakaroğlu',
            kullanici_adi: email.split('@')[0] || 'berkay',
            eposta: email || 'berkay@fellowcalendar.com'
          }
        });
      } else {
        // Mock Başarılı Kayıt
        setSuccessMsg('Kayıt başarılı! Şimdi belirlediğiniz şifreyle giriş yapabilirsiniz.');
        setIsLogin(true);
        setSifre('');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F7F4',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '920px',
          background: '#FFFFFF',
          border: '1px solid #E6E4DD',
          borderRadius: '24px',
          boxShadow: '0 20px 50px -10px rgba(0, 87, 255, 0.08), 0 4px 15px rgba(0,0,0,0.03)',
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          overflow: 'hidden',
        }}
      >
        {/* SOL PANEL */}
        <div
          style={{
            background: 'linear-gradient(145deg, #0057FF 0%, #003db3 100%)',
            color: '#FFFFFF',
            padding: '44px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.15)',
                padding: '8px 14px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                marginBottom: '28px',
              }}
            >
              <Calendar size={20} color="#FFFFFF" />
              <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Lets<span style={{ color: '#F8F7F4' }}>Meet</span>
              </span>
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: '800', lineHeight: 1.25, marginBottom: '14px' }}>
              Arkadaşlarınla ortak zamanı saniyeler içinde bul.
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(248, 247, 244, 0.8)', lineHeight: 1.5, marginBottom: '30px' }}>
              Mesajlaşma gruplarında "kim ne zaman müsait?" kaosuna son verin. Takvimleri otomatik eşleyin ve en uygun saati tek tıkla görün.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600' }}>
                <CheckCircle2 size={18} color="#F8F7F4" />
                <span>Grup meşguliyetlerini anlık tara</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600' }}>
                <CheckCircle2 size={18} color="#F8F7F4" />
                <span>Uçtan uca şifreli oturum güvenliği</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600' }}>
                <CheckCircle2 size={18} color="#F8F7F4" />
                <span>Canlı saat ve hava durumu entegrasyonu</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>
            © 2026 LetsMeet • Birlikte plan yapmanın en hızlı yolu.
          </div>
        </div>

        {/* SAĞ PANEL */}
        <div style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#14171F', marginBottom: '6px' }}>
              {isLogin ? 'Tekrar Hoş Geldin! 👋' : 'Hemen Hesabını Oluştur 🚀'}
            </h3>
            <p style={{ fontSize: '13px', color: '#5E6678' }}>
              {isLogin ? 'Planlarını yönetmek için lütfen giriş yap.' : 'Arkadaş grubuna katılmak için formu doldur.'}
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                background: '#FEECEB',
                border: '1px solid #E53935',
                color: '#E53935',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '18px',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#D4F7DC',
                border: '1px solid #00875A',
                color: '#00875A',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '18px',
              }}
            >
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Ad Soyad
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#949DAE" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Ahmet Yılmaz"
                      value={isim}
                      onChange={(e) => setIsim(e.target.value)}
                      required
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    Kullanıcı Adı
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#949DAE', fontWeight: 'bold' }}>@</span>
                    <input
                      type="text"
                      placeholder="ahmety"
                      value={kullaniciAdi}
                      onChange={(e) => setKullaniciAdi(e.target.value)}
                      required
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                E-Posta Adresi
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#949DAE" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Şifre
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#949DAE" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  required
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '700',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? 'İşleniyor...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol ve Başla'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#5E6678' }}>
            {isLogin ? 'Henüz bir hesabın yok mu?' : 'Zaten bir hesabın var mı?'}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0057FF',
                fontWeight: '800',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '13px',
              }}
            >
              {isLogin ? 'Hemen Kayıt Ol' : 'Giriş Yap'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}