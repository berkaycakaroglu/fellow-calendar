import React, { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin } from 'lucide-react';

export default function LiveClockWeather() {
  const [time, setTime] = useState(new Date());
  // Upper Bar'da görünen şehir adı (Örn: Ankara, Türkiye)
  const [currentCityName, setCurrentCityName] = useState('Ankara, Türkiye');
  const [weather, setWeather] = useState({
    temp: null,
    condition: 'Yükleniyor...',
    emoji: '🌤️'
  });

  // Canlı Saat (Saniyede bir)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherDetails = (code) => {
    if (code === 0) return { label: 'Açık', emoji: '☀️' };
    if (code === 1 || code === 2) return { label: 'Az Bulutlu', emoji: '🌤️' };
    if (code === 3) return { label: 'Parçalı Bulutlu', emoji: '⛅' };
    if ([45, 48].includes(code)) return { label: 'Sisli', emoji: '🌫️' };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: 'Yağmurlu', emoji: '🌧️' };
    if ([71, 73, 75, 85, 86].includes(code)) return { label: 'Karlı', emoji: '❄️' };
    if ([95, 96, 99].includes(code)) return { label: 'Fırtına', emoji: '⛈️' };
    return { label: 'Bulutlu', emoji: '☁️' };
  };

  const fetchWeather = async (lat, lon, cityName) => {
    setCurrentCityName(cityName);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      if (res.ok) {
        const data = await res.json();
        const details = getWeatherDetails(data.current_weather.weathercode);
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          condition: details.label,
          emoji: details.emoji,
        });
      }
    } catch {
      setWeather({ temp: 24, condition: 'Açık', emoji: '☀️' });
    }
  };

  // Ayarlardan okuma ve güncelleme
  const updateWeatherFromPreferences = useCallback(() => {
    const mode = localStorage.getItem('user_location_mode') || 'manual';

    if (mode === 'auto' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          let cityName = 'Canlı Konum';
          try {
            // Koordinatlardan Canlı Şehir Adını Bul (Reverse Geocoding)
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              cityName = geoData.principalSubdivision || geoData.city || 'Canlı Konum';
              if (geoData.countryName) cityName += `, ${geoData.countryName}`;
            }
          } catch {
            cityName = 'Canlı Konum';
          }
          fetchWeather(latitude, longitude, cityName);
        },
        () => {
          // GPS hatası durumunda manuel seçili şehre dön
          const savedCityName = localStorage.getItem('user_city_name') || 'Ankara, Türkiye';
          const lat = localStorage.getItem('user_city_lat') || 39.9334;
          const lon = localStorage.getItem('user_city_lon') || 32.8597;
          fetchWeather(lat, lon, savedCityName);
        }
      );
    } else {
      // Manuel Seçili Şehir (localStorage'dan koordinatları oku)
      const savedCityName = localStorage.getItem('user_city_name') || 'Ankara, Türkiye';
      const lat = localStorage.getItem('user_city_lat') || 39.9334;
      const lon = localStorage.getItem('user_city_lon') || 32.8597;
      fetchWeather(lat, lon, savedCityName);
    }
  }, []);

  useEffect(() => {
    updateWeatherFromPreferences();
    // Ayarlar değiştiğinde anında Upper Bar'ı yenile
    window.addEventListener('locationPreferenceChanged', updateWeatherFromPreferences);
    return () => {
      window.removeEventListener('locationPreferenceChanged', updateWeatherFromPreferences);
    };
  }, [updateWeatherFromPreferences]);

  const timeString = time.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: '#F8F7F4',
        border: '1px solid #E6E4DD',
        padding: '6px 14px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '700',
        color: '#14171F',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
      }}
    >
      {/* Canlı Saat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#0057FF',
            boxShadow: '0 0 6px #0057FF',
          }}
        />
        <Clock size={13} color="#0057FF" />
        <span style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.5px' }}>
          {timeString}
        </span>
      </div>

      <span style={{ color: '#E6E4DD' }}>|</span>

      {/* Global Hava Durumu ve Şehir Adı */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '15px' }}>{weather.emoji}</span>
        {weather.temp !== null && (
          <span style={{ color: '#0057FF', fontWeight: '800' }}>{weather.temp}°C</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#5E6678', fontSize: '11px' }}>
          <MapPin size={11} />
          <span>{currentCityName}</span>
        </div>
      </div>
    </div>
  );
}