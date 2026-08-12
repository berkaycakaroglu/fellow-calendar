import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function MyCalendar() {
  const [date, setDate] = useState(new Date());

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '10px 0' }}>
      <Calendar onChange={setDate} value={date} />
      <p style={{ marginTop: '15px', color: '#4a5568', textAlign: 'center' }}>
        Seçilen Tarih: <strong>{date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
      </p>
    </div>
  );
}