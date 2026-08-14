import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Check, AlertCircle } from 'lucide-react';
import TimeWheelPicker from './TimeWheelPicker';

export default function EventModal({ user, selectedDate, editingEvent, onClose, onSaved }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState(editingEvent ? editingEvent.baslik : '');
  const [errorMsg, setErrorMsg] = useState('');

  const initialDateStr = editingEvent
    ? editingEvent.baslangic.substring(0, 10)
    : selectedDate instanceof Date
      ? selectedDate.toISOString().split('T')[0]
      : todayStr;

  // Seçilen tarih bugünden eskiyse otomatik olarak bugüne ayarla
  const [eventDate, setEventDate] = useState(initialDateStr < todayStr ? todayStr : initialDateStr);

  const [isAllDay, setIsAllDay] = useState(
    editingEvent
      ? editingEvent.baslangic.includes('00:00:00') && editingEvent.bitis.includes('23:59:00')
      : false
  );

  const [startHour, setStartHour] = useState(editingEvent ? editingEvent.baslangic.substring(11, 13) : '14');
  const [startMinute, setStartMinute] = useState(editingEvent ? editingEvent.baslangic.substring(14, 16) : '00');
  const [endHour, setEndHour] = useState(editingEvent ? editingEvent.bitis.substring(11, 13) : '15');
  const [endMinute, setEndMinute] = useState(editingEvent ? editingEvent.bitis.substring(14, 16) : '00');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Lütfen plan adını girin.');
      return;
    }

    if (eventDate < todayStr) {
      setErrorMsg('Geçmiş bir tarihe plan oluşturulamaz.');
      return;
    }

    if (!isAllDay) {
      const startTotalMinutes = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10);
      const endTotalMinutes = parseInt(endHour, 10) * 60 + parseInt(endMinute, 10);

      if (startTotalMinutes >= endTotalMinutes) {
        setErrorMsg('Bitiş saati, başlangıç saatinden daha ileri bir saat olmalıdır!');
        return;
      }
    }

    let start = `${eventDate}T${startHour}:${startMinute}:00`;
    let end = `${eventDate}T${endHour}:${endMinute}:00`;

    if (isAllDay) {
      start = `${eventDate}T00:00:00`;
      end = `${eventDate}T23:59:00`;
    }

    const payload = {
      kullanici_id: user.id,
      baslik: title.trim(),
      baslangic: start,
      bitis: end,
      oncelik: 2,
    };

    try {
      let res;
      if (editingEvent) {
        res = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || 'Kayıt başarısız oldu.');
      }
    } catch {
      setErrorMsg('Sunucuya bağlanılamadı.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>{editingEvent ? '✏️ Planı Düzenle' : '➕ Yeni Plan Oluştur'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMsg && (
            <div style={{ background: '#FEECEB', border: '1px solid #E53935', color: '#E53935', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label>Plan Adı</label>
            <input
              type="text"
              placeholder="Örn: Proje Toplantısı, Spor..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Tarih Seçimi (En Erken: Bugün)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <CalendarIcon size={16} color="#0057FF" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
              <input
                type="date"
                min={todayStr} // BUGÜNDEN ÖNCEKİ TARİHLER SEÇİLEMEZ
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                style={{ paddingLeft: '38px', cursor: 'pointer', fontWeight: '700', color: '#14171F' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              id="allDayCheck"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0057FF' }}
            />
            <label htmlFor="allDayCheck" style={{ margin: 0, cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#5E6678', textTransform: 'none' }}>
              Tüm Gün Meşgulüm
            </label>
          </div>

          <div style={{ background: '#F8F7F4', padding: '14px', borderRadius: '12px', border: '1px solid #E6E4DD', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TimeWheelPicker
                label="Başlangıç"
                hour={startHour}
                minute={startMinute}
                onHourChange={setStartHour}
                onMinuteChange={setStartMinute}
                disabled={isAllDay}
              />
              <span style={{ fontSize: '14px', color: '#949DAE', fontWeight: 'bold', marginTop: '16px' }}>➔</span>
              <TimeWheelPicker
                label="Bitiş"
                hour={endHour}
                minute={endMinute}
                onHourChange={setEndHour}
                onMinuteChange={setEndMinute}
                disabled={isAllDay}
              />
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #E6E4DD', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#5E6678' }}>
              <Check size={13} color="#0057FF" />
              <span>Seçilen: <strong style={{ color: '#14171F' }}>{eventDate} {isAllDay ? '(Tüm Gün)' : `| ${startHour}:${startMinute} - ${endHour}:${endMinute}`}</strong></span>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: '13px' }}>
            {editingEvent ? 'Değişiklikleri Kaydet' : 'Planı Takvime Ekle'}
          </button>
        </form>
      </div>
    </div>
  );
}