import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, Search, Loader2, User, Lock, Mail, AlertCircle } from 'lucide-react';

export default function SettingsModal({ user, onClose, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'location'

  // Profil Form State'leri
  const [isim, setIsim] = useState(user?.isim || user?.name || '');
  const [email, setEmail] = useState(user?.eposta || user?.email || '');
  const [sifre, setSifre] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Konum Modu
  const [locationMode, setLocationMode] = useState(() => {
    return localStorage.getItem('user_location_mode') || 'manual';
  });

  const [selectedCityName, setSelectedCityName] = useState(() => {
    return localStorage.getItem('user_city_name') || 'Ankara, Türkiye';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const searchRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
  const token = user?.access_token || localStorage.getItem('token') || '';

  // Profil Güncelleme İşlemi
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (sifre && sifre.trim()) {
      if (sifre.length < 8) {
        setProfileMsg({ type: 'error', text: 'Yeni şifre en az 8 karakter olmalıdır.' });
        return;
      }
      if (!/[A-Z]/.test(sifre)) {
        setProfileMsg({ type: 'error', text: 'Yeni şifre en az 1 büyük harf içermelidir.' });
        return;
      }
      if (!/[!@#$%^&*?_~+\-]/.test(sifre)) {
        setProfileMsg({ type: 'error', text: 'Yeni şifre en az 1 özel karakter içermelidir.' });
        return;
      }
    }

    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          isim: isim.trim(),
          eposta: email.trim(),
          sifre: sifre.trim() || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: 'success', text: data.message || 'Profil başarıyla güncellendi.' });
        setSifre('');
        if (onUserUpdated) {
          onUserUpdated({ isim: isim.trim(), name: isim.trim(), eposta: email.trim(), email: email.trim() });
        }
      } else {
        setProfileMsg({ type: 'error', text: data.detail || 'Güncelleme yapılamadı.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Sunucuya bağlanılamadı.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Konum Arama API Debounce
  useEffect(() => {
    if (searchTerm.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${searchTerm.trim()}&count=5&language=tr&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.results) {
            const formattedResults = data.results.map((item) => ({
              id: item.id,
              name: item.name,
              country: item.country || '',
              countryCode: item.country_code || '',
              lat: item.latitude,
              lon: item.longitude,
              admin: item.admin1 ? `, ${item.admin1}` : ''
            }));
            setSearchResults(formattedResults);
          } else {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.error('Şehir aranırken hata oluştu:', err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleAutoLocation = () => {
    if (locationMode === 'manual') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationMode('auto');
            localStorage.setItem('user_location_mode', 'auto');
            window.dispatchEvent(new Event('locationPreferenceChanged'));
          },
          () => {
            alert('Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin veya manuel arama yapın.');
          }
        );
      }
    } else {
      setLocationMode('manual');
      localStorage.setItem('user_location_mode', 'manual');
      window.dispatchEvent(new Event('locationPreferenceChanged'));
    }
  };

  const handleSelectCity = (cityObj) => {
    const fullCityName = `${cityObj.name}${cityObj.admin}, ${cityObj.country}`;
    setSelectedCityName(fullCityName);
    setSearchTerm(fullCityName);

    localStorage.setItem('user_city_name', fullCityName);
    localStorage.setItem('user_city_lat', cityObj.lat);
    localStorage.setItem('user_city_lon', cityObj.lon);

    setSearchResults([]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    window.dispatchEvent(new Event('locationPreferenceChanged'));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h2>⚙️ Hesap & Tercihler</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Üst Sekmeler */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '12px',
              backgroundColor: activeTab === 'profile' ? '#0057FF' : '#F8F7F4',
              color: activeTab === 'profile' ? '#FFF' : '#5E6678',
              border: '1px solid #E6E4DD'
            }}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profil Bilgileri
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '12px',
              backgroundColor: activeTab === 'location' ? '#0057FF' : '#F8F7F4',
              color: activeTab === 'location' ? '#FFF' : '#5E6678',
              border: '1px solid #E6E4DD'
            }}
            onClick={() => setActiveTab('location')}
          >
            📍 Hava Durumu & Konum
          </button>
        </div>

        <div className="modal-body">
          {/* SEKME 1: PROFİL VE ŞİFRE GÜNCELLEME */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profileMsg.text && (
                <div style={{
                  background: profileMsg.type === 'error' ? '#FEECEB' : '#D4F7DC',
                  border: `1px solid ${profileMsg.type === 'error' ? '#E53935' : '#00875A'}`,
                  color: profileMsg.type === 'error' ? '#E53935' : '#00875A',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {profileMsg.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Ad Soyad
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#949DAE" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={isim}
                    onChange={(e) => setIsim(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  E-Posta Adresi
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#949DAE" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Yeni Şifre (Değiştirmek İstemiyorsanız Boş Bırakın)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#949DAE" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={profileLoading}
                style={{ marginTop: '8px', padding: '10px', fontSize: '13px' }}
              >
                {profileLoading ? 'Güncelleniyor...' : 'Bilgileri Kaydet'}
              </button>
            </form>
          )}

          {/* SEKME 2: KONUM VE HAVA DURUMU */}
          {activeTab === 'location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FFFFFF',
                border: '1px solid #E6E4DD',
                padding: '10px 12px',
                borderRadius: '10px',
              }}>
                <div>
                  <strong style={{ fontSize: '12px', color: '#14171F', display: 'block' }}>
                    Canlı Konumu Algıla (GPS)
                  </strong>
                  <span style={{ fontSize: '10px', color: '#5E6678' }}>
                    {locationMode === 'auto' ? 'Tarayıcı koordinatları aktif.' : 'Manuel şehir araması devrede.'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={locationMode === 'auto'}
                  onChange={handleToggleAutoLocation}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0057FF' }}
                />
              </div>

              {locationMode === 'manual' && (
                <div ref={searchRef} style={{ position: 'relative', background: '#F8F7F4', border: '1px solid #E6E4DD', padding: '12px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', display: 'block', marginBottom: '6px' }}>
                    DÜNYADA ŞEHİR ARA
                  </span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Örn: İzmir, Berlin, Tokyo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        paddingLeft: '34px',
                        borderRadius: '8px',
                        border: '1px solid #E6E4DD',
                        background: '#FFFFFF',
                        fontWeight: '600',
                        color: '#14171F',
                        fontSize: '13px'
                      }}
                    />
                    <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" color="#0057FF" />
                      ) : (
                        <Search size={16} color="#949DAE" />
                      )}
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: '12px',
                      right: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #E6E4DD',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '4px'
                    }}>
                      {searchResults.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleSelectCity(city)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F8F7F4'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {city.countryCode && (
                            <img
                              src={`https://flagcdn.com/20x15/${city.countryCode.toLowerCase()}.png`}
                              alt={city.countryCode}
                              style={{ width: '16px', height: '12px', borderRadius: '2px' }}
                            />
                          )}
                          <div>
                            <strong style={{ fontSize: '12px', color: '#14171F', display: 'block' }}>
                              {city.name}{city.admin}
                            </strong>
                            <span style={{ fontSize: '10px', color: '#949DAE' }}>
                              {city.country}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {savedSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00875A', fontSize: '11px', fontWeight: '700' }}>
                  <Check size={13} /> Şehir tercihi güncellendi!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}