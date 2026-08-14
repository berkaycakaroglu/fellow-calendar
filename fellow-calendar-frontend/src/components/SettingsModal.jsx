import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, Search, Loader2 } from 'lucide-react';

export default function SettingsModal({ user, onClose }) {
  // Konum Modu: 'auto' (GPS) veya 'manual'
  const [locationMode, setLocationMode] = useState(() => {
    return localStorage.getItem('user_location_mode') || 'manual';
  });

  // Seçili Şehrin Görünen Adı ( Upper Bar için)
  const [selectedCityName, setSelectedCityName] = useState(() => {
    return localStorage.getItem('user_city_name') || 'Ankara, Türkiye';
  });

  // Arama Input Değeri
  const [searchTerm, setSearchTerm] = useState('');
  // API'den gelen arama sonuçları
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const searchRef = useRef(null);

  // 1. Otomatik Tamamlama: Kullanıcı yazarken API'den şehir arama
  useEffect(() => {
    // En az 3 harf yazılmasını bekle
    if (searchTerm.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    // Debounce: Kullanıcı yazmayı bırakınca 500ms sonra API'ye istek at
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsLoading(true);
        // Open-Meteo Ücretsiz Geocoding API (Max 5 sonuç, Türkçe sonuçlar)
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${searchTerm.trim()}&count=5&language=tr&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          // API'den gelen veriyi bizim formata çevir
          if (data.results) {
            const formattedResults = data.results.map((item) => ({
              id: item.id,
              name: item.name,
              country: item.country || '',
              countryCode: item.country_code || '',
              lat: item.latitude,
              lon: item.longitude,
              // Admin1 genellikle il/eyalet bilgisidir
              admin: item.admin1 ? `, ${item.admin1}` : ''
            }));
            setSearchResults(formattedResults);
          } else {
            setSearchResults([]); // Sonuç yoksa boşalt
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

  // Arama panelinin dışına tıklanınca sonuçları kapat
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
            // Upper Bar'a ayarların değiştiğini haber ver
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

  // Sonuçlardan bir şehir seçildiğinde
  const handleSelectCity = (cityObj) => {
    const fullCityName = `${cityObj.name}${cityObj.admin}, ${cityObj.country}`;
    setSelectedCityName(fullCityName);
    setSearchTerm(fullCityName); // Input'a seçilen ismi yaz

    // localStorage'a koordinatları ve ismi kaydet
    localStorage.setItem('user_city_name', fullCityName);
    localStorage.setItem('user_city_lat', cityObj.lat);
    localStorage.setItem('user_city_lon', cityObj.lon);

    setSearchResults([]); // Listeyi kapat
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    // Upper Bar'a ayarların değiştiğini haber ver
    window.dispatchEvent(new Event('locationPreferenceChanged'));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h2>⚙️ Hesap & Tercihler</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Kullanıcı Özeti */}
          <div style={{ background: '#F8F7F4', border: '1px solid #E6E4DD', padding: '12px 14px', borderRadius: '12px', marginBottom: '18px' }}>
            <strong style={{ fontSize: '13px', color: '#14171F', display: 'block' }}>{user?.isim}</strong>
            <span style={{ fontSize: '11px', color: '#5E6678' }}>@{user?.kullanici_adi} | {user?.email}</span>
          </div>

          {/* Konum & Hava Durumu Ayar Bölümü */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <MapPin size={13} color="#0057FF" /> Hava Durumu & Konum Ayarı
            </label>

            {/* Otomatik GPS Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1px solid #E6E4DD',
              padding: '10px 12px',
              borderRadius: '10px',
              marginBottom: '12px'
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

            {/* Manuel Global Şehir Araması (GPS kapalıyken görünür) */}
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

                {/* Otomatik Tamamlama Sonuçları Listesi */}
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
                        {/* Ülke Bayrağı (Opsiyonel, Tarayıcı desteğine bağlı) */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00875A', fontSize: '11px', fontWeight: '700', marginTop: '8px' }}>
                <Check size={13} /> Şehir tercihi güncellendi!
              </div>
            )}
          </div>

          <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '9px', fontSize: '13px' }}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}