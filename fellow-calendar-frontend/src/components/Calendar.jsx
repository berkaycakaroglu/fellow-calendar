import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Users,
  UserPlus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  Sparkles,
  Layers,
  AlertCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  UserCheck
} from 'lucide-react';

export default function Calendar({ user }) {
  const [activeTab, setActiveTab] = useState('personal');

  // Tarih State'leri (Ağustos 2026)
  const [selectedDay, setSelectedDay] = useState(14);
  const selectedDateStr = `2026-08-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`;

  // Veri State'leri
  const [events, setEvents] = useState([]);
  const [friendsData, setFriendsData] = useState({ arkadaslar: [], istekler: [], grup_istekleri: [] });
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Grup Takvimi & Teklifler
  const [groupTimeline, setGroupTimeline] = useState([]);
  const [groupCommonSlots, setGroupCommonSlots] = useState([]);
  const [groupProposals, setGroupProposals] = useState([]);

  // Modallar ve Formlar
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ baslik: '', baslaSaat: '14:00', bitisSaat: '16:00', oncelik: 1 });

  // Arkadaşı Gruba Davet Etme Modalı State'leri
  const [inviteModalFriend, setInviteModalFriend] = useState(null);
  const [selectedGroupIdToInvite, setSelectedGroupIdToInvite] = useState('');

  // Teklif Formu State'leri
  const [proposalTitle, setProposalTitle] = useState('');
  const [selectedSlotForProposal, setSelectedSlotForProposal] = useState('');
  const [showProposalBox, setShowProposalBox] = useState(false);

  // Arkadaş & Grup Formları
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [joinToken, setJoinToken] = useState('');

  const API_BASE = 'http://127.0.0.1:8000';

  // Veri Çekme Fonksiyonları
  const fetchEvents = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/events`);
      if (res.ok) setEvents(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchFriends = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/friends`);
      if (res.ok) setFriendsData(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchGroups = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/groups`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroup) setSelectedGroup(data[0]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchProposals = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/group-proposals`);
      if (res.ok) setGroupProposals(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchGroupCalendarData = async () => {
    if (!selectedGroup) return;
    try {
      const timelineRes = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/timeline?tarih=${selectedDateStr}`);
      if (timelineRes.ok) {
        const tData = await timelineRes.json();
        setGroupTimeline(tData.uyeler || []);
      }

      const slotsRes = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/common-slots?tarih=${selectedDateStr}`);
      if (slotsRes.ok) {
        const sData = await slotsRes.json();
        setGroupCommonSlots(sData.uygun_saat_araliklari || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchEvents();
    fetchFriends();
    fetchGroups();
    fetchProposals();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'group_calendar' && selectedGroup) {
      fetchGroupCalendarData();
    }
  }, [activeTab, selectedGroup, selectedDay]);

  // 1. KİŞİSEL PLAN EKLEME
  const handleAddPersonalPlan = async (e) => {
    e.preventDefault();
    if (!planForm.baslik.trim()) return;

    const baslangic = `${selectedDateStr}T${planForm.baslaSaat}:00`;
    const bitis = `${selectedDateStr}T${planForm.bitisSaat}:00`;

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kullanici_id: user.id,
          baslik: planForm.baslik.trim(),
          baslangic,
          bitis,
          oncelik: parseInt(planForm.oncelik),
          grup_id: null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddPlanModalOpen(false);
        setPlanForm({ baslik: '', baslaSaat: '14:00', bitisSaat: '16:00', oncelik: 1 });
        fetchEvents();
        if (selectedGroup) fetchGroupCalendarData();
      } else {
        alert(data.detail || 'Plan eklenemedi.');
      }
    } catch {
      alert('Sunucu hatası oluştu.');
    }
  };

  // Plan Silme
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Bu planı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvents();
        if (selectedGroup) fetchGroupCalendarData();
      }
    } catch (e) { console.error(e); }
  };

  // 2. BULUŞMA TEKLİFİ GÖNDERME
  const handleSendProposal = async () => {
    if (!proposalTitle.trim() || !selectedSlotForProposal) {
      alert('Lütfen bir başlık yazın ve saat aralığı seçin.');
      return;
    }
    const [start, end] = selectedSlotForProposal.split(' - ');

    try {
      const res = await fetch(`${API_BASE}/api/groups/propose-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grup_id: selectedGroup.id,
          teklif_eden_id: user.id,
          baslik: proposalTitle.trim(),
          tarih: selectedDateStr,
          baslangic_saat: start,
          bitis_saat: end
        })
      });

      if (res.ok) {
        alert('Buluşma teklifi gruba iletildi! Diğer üyeler oylayabilir.');
        setProposalTitle('');
        setShowProposalBox(false);
        fetchProposals();
      }
    } catch {
      alert('Teklif gönderilemedi.');
    }
  };

  // 3. TEKLİFE YANIT VERME (BEN VARIM / BEN YOKUM)
  const handleRespondProposal = async (teklifId, kabulMu) => {
    try {
      const res = await fetch(`${API_BASE}/api/groups/respond-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teklif_id: teklifId,
          kullanici_id: user.id,
          kabul_mu: kabulMu
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchProposals();
        fetchEvents();
      }
    } catch {
      alert('İşlem başarısız.');
    }
  };

  // 4. ARKADAŞI GRUBA DAVET ETME FONKSİYONU
  const handleInviteFriendToGroup = async (e) => {
    e.preventDefault();
    if (!selectedGroupIdToInvite || !inviteModalFriend) return;

    try {
      const res = await fetch(`${API_BASE}/api/groups/invite-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grup_id: parseInt(selectedGroupIdToInvite),
          gonderen_id: user.id,
          davet_edilen_id: inviteModalFriend.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`${inviteModalFriend.isim} kullanıcısına grup daveti başarıyla iletildi!`);
        setInviteModalFriend(null);
        setSelectedGroupIdToInvite('');
      } else {
        alert(data.detail || 'Davet gönderilemedi.');
      }
    } catch {
      alert('Sunucu hatası oluştu.');
    }
  };

  // 5. GELEN GRUP DAVETİNE YANIT VERME
  const handleRespondGroupInvite = async (davetId, kabulMu) => {
    try {
      const res = await fetch(`${API_BASE}/api/groups/respond-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          davet_id: davetId,
          kabul_mu: kabulMu
        })
      });
      const data = await res.json();
      alert(data.message);
      fetchFriends();
      fetchGroups();
    } catch {
      alert('İşlem başarısız.');
    }
  };

  // Seçilen Güne Ait Kişisel Planlar
  const selectedDayEvents = events.filter(e => e.baslangic.startsWith(selectedDateStr));

  // Toplam Gruplarım Bildirim Sayısı (Gelen Grup Davetleri + Gelen Buluşma Teklifleri)
  const totalGroupNotifications = (friendsData.grup_istekleri?.length || 0) + groupProposals.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ÜST GEZİNME ÇUBUĞU */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

        {/* 4 ANA SEKME */}
        <div style={{ display: 'inline-flex', background: '#FFFFFF', padding: '4px', borderRadius: '14px', border: '1px solid #E6E4DD', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('personal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'personal' ? '#0057FF' : 'transparent',
              color: activeTab === 'personal' ? '#FFFFFF' : '#5E6678'
            }}
          >
            <CalendarIcon size={15} /> Kişisel Takvim
          </button>

          <button
            onClick={() => setActiveTab('group_calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'group_calendar' ? '#0057FF' : 'transparent',
              color: activeTab === 'group_calendar' ? '#FFFFFF' : '#5E6678'
            }}
          >
            <Users size={15} /> Grup Takvimi
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'friends' ? '#0057FF' : 'transparent',
              color: activeTab === 'friends' ? '#FFFFFF' : '#5E6678'
            }}
          >
            <UserPlus size={15} /> Arkadaşlar
            {friendsData.istekler.length > 0 && (
              <span style={{ background: '#E53935', color: '#FFF', fontSize: '10px', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {friendsData.istekler.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'groups' ? '#0057FF' : 'transparent',
              color: activeTab === 'groups' ? '#FFFFFF' : '#5E6678',
              position: 'relative'
            }}
          >
            <Layers size={15} /> Gruplarım
            {totalGroupNotifications > 0 && (
              <span style={{ background: '#E53935', color: '#FFF', fontSize: '10px', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalGroupNotifications}
              </span>
            )}
          </button>
        </div>

        {/* Sağ: Ay Seçici & Plan Ekle Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', padding: '6px 12px', borderRadius: '10px', border: '1px solid #E6E4DD' }}>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#14171F' }}>Ağustos 2026</span>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><ChevronRight size={16} /></button>
          </div>

          <button
            onClick={() => setIsAddPlanModalOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}
          >
            <Plus size={16} /> Plan Ekle
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SEKME: KİŞİSEL TAKVİM                                 */}
      {/* ======================================================== */}
      {activeTab === 'personal' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Ay Izgarası */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '10px' }}>
              {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map(d => (
                <span key={d} style={{ fontSize: '11px', fontWeight: '800', color: '#949DAE' }}>{d}</span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const dateStr = `2026-08-${day < 10 ? '0' + day : day}`;
                const hasEvent = events.some(e => e.baslangic.startsWith(dateStr));

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      minHeight: '65px',
                      borderRadius: '12px',
                      padding: '8px',
                      cursor: 'pointer',
                      background: day === selectedDay ? '#EBF1FF' : '#F8F7F4',
                      border: day === selectedDay ? '2px solid #0057FF' : '1px solid #E6E4DD',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: day === selectedDay ? '#0057FF' : '#14171F' }}>
                        {day < 10 ? `0${day}` : day}
                      </span>
                      {day === 14 && (
                        <span style={{ fontSize: '9px', fontWeight: '800', background: '#D4F7DC', color: '#00875A', padding: '2px 5px', borderRadius: '6px' }}>
                          BUGÜN
                        </span>
                      )}
                    </div>
                    {hasEvent && (
                      <span style={{ width: '6px', height: '6px', background: '#0057FF', borderRadius: '50%', alignSelf: 'flex-end' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Günün Detayı */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#14171F', marginBottom: '2px' }}>
                🗓️ {selectedDay} Ağustos 2026
              </h3>
              <span style={{ fontSize: '12px', color: '#5E6678' }}>
                {selectedDayEvents.length} kayıtlı kişisel plan
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', background: '#F8F7F4', borderRadius: '16px', border: '1px dashed #E6E4DD' }}>
                <span style={{ fontSize: '24px' }}>☕</span>
                <p style={{ fontSize: '13px', color: '#5E6678', marginTop: '8px' }}>Bu güne ait kayıtlı planınız yok.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {selectedDayEvents.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F8F7F4', borderRadius: '10px', borderLeft: '4px solid #0057FF' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#14171F', display: 'block' }}>{e.baslik}</strong>
                      <span style={{ fontSize: '11px', color: '#5E6678' }}>
                        🕒 {e.baslangic.substring(11, 16)} - {e.bitis.substring(11, 16)}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteEvent(e.id)} style={{ border: 'none', background: 'transparent', color: '#E53935', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SEKME: GRUP TAKVİMİ & BULUŞMA TEKLİFİ ETME             */}
      {/* ======================================================== */}
      {activeTab === 'group_calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '12px 18px', borderRadius: '16px', border: '1px solid #E6E4DD' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color="#0057FF" />
              <strong style={{ fontSize: '13px', color: '#14171F' }}>Aktif Grup Takvimi:</strong>
              {groups.length > 0 ? (
                <select
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const g = groups.find(item => item.id === parseInt(e.target.value));
                    setSelectedGroup(g);
                  }}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px', fontWeight: '700', color: '#0057FF', background: '#F8F7F4' }}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.grup_adi} ({g.uye_sayisi} Üye)</option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '12px', color: '#E53935' }}>Henüz bir grubunuz yok.</span>
              )}
            </div>

            <div style={{ fontSize: '11px', color: '#5E6678', fontWeight: '600' }}>
              👥 24 saatlik akıllı grup boş zaman eşleştiricisi aktif.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '20px' }}>

            {/* Sol: Ay Takvimi */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '10px' }}>
                {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map(d => (
                  <span key={d} style={{ fontSize: '11px', fontWeight: '800', color: '#949DAE' }}>{d}</span>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      minHeight: '65px',
                      borderRadius: '12px',
                      padding: '8px',
                      cursor: 'pointer',
                      background: day === selectedDay ? '#EBF1FF' : '#F8F7F4',
                      border: day === selectedDay ? '2px solid #0057FF' : '1px solid #E6E4DD',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: day === selectedDay ? '#0057FF' : '#14171F' }}>
                        {day < 10 ? `0${day}` : day}
                      </span>
                      {day === 14 && (
                        <span style={{ fontSize: '9px', fontWeight: '800', background: '#D4F7DC', color: '#00875A', padding: '2px 5px', borderRadius: '6px' }}>
                          BUGÜN
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ: Grup Meşguliyet & Buluşma Teklifi Etme */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14171F', marginBottom: '2px' }}>
                  🗓️ {selectedDay} Ağustos 2026 — {selectedGroup?.grup_adi}
                </h3>
                <span style={{ fontSize: '12px', color: '#5E6678' }}>Üyelerin 24 saatlik meşguliyet durumu</span>
              </div>

              {/* Meşguliyet Listesi */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#E53935', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <AlertCircle size={13} /> Üye Meşguliyetleri (Dolu Saatler)
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '130px', overflowY: 'auto' }}>
                  {groupTimeline.map(uye => {
                    const hasEvents = uye.etkinlikler && uye.etkinlikler.length > 0;
                    return (
                      <div key={uye.kullanici_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8F7F4', borderRadius: '8px', border: '1px solid #E6E4DD' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#14171F' }}>
                          👤 {uye.isim} (@{uye.kullanici_adi})
                        </span>
                        {hasEvents ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {uye.etkinlikler.map(e => (
                              <span key={e.id} style={{ background: '#FEECEB', color: '#E53935', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '6px' }}>
                                ⛔ {e.baslangic} - {e.bitis} Dolu ({e.baslik})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#00875A', fontSize: '11px', fontWeight: '700', background: '#D4F7DC', padding: '2px 6px', borderRadius: '6px' }}>
                            ✅ Tüm Gün Müsait
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ortak Boş Saatler */}
              <div style={{ background: '#F0F5FF', border: '1px solid rgba(0,87,255,0.2)', padding: '16px', borderRadius: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0057FF', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                  <Sparkles size={14} /> Ortak Buluşulabilecek Saatler (Herkes Müsait)
                </span>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {groupCommonSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedSlotForProposal(slot);
                        setShowProposalBox(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: selectedSlotForProposal === slot ? '#0057FF' : '#FFFFFF',
                        color: selectedSlotForProposal === slot ? '#FFFFFF' : '#0057FF',
                        border: '1px solid #0057FF',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Teklif etmek için tıkla"
                    >
                      <Clock size={12} />
                      <span>{slot}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BULUŞMA TEKLİFİ FORMU */}
              <div style={{ borderTop: '1px solid #E6E4DD', paddingTop: '12px' }}>
                {!showProposalBox ? (
                  <button
                    onClick={() => setShowProposalBox(true)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Send size={15} /> Bu Gruba Buluşma Teklif Et
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Buluşma Başlığı (Örn: Proje Toplantısı / Kahve)"
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                    />

                    <span style={{ fontSize: '11px', color: '#5E6678' }}>
                      Seçili Aralık: <strong>{selectedSlotForProposal || 'Yukarıdaki mavi saatlerden birine tıklayın'}</strong>
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={handleSendProposal}
                        className="btn-primary"
                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                      >
                        Teklifi Gönder (Oylamaya Aç)
                      </button>
                      <button
                        onClick={() => setShowProposalBox(false)}
                        style={{ background: '#F8F7F4', border: '1px solid #E6E4DD', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SEKME: GRUPLARIM & OYLAMA PANELİ                      */}
      {/* ======================================================== */}
      {activeTab === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* GELEN GRUP DAVETLERİ (ARKADAŞLARINDAN GELENLER) */}
            {friendsData.grup_istekleri?.length > 0 && (
              <div style={{ background: '#FFF8E6', border: '1px solid #FFE082', borderRadius: '20px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#B78103', marginBottom: '12px' }}>
                  📩 Gelen Grup Katılım Davetleri ({friendsData.grup_istekleri.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friendsData.grup_istekleri.map(gd => (
                    <div key={gd.davet_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #FFE082' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#14171F', display: 'block' }}>{gd.grup_adi}</strong>
                        <span style={{ fontSize: '11px', color: '#5E6678' }}>👤 <strong>{gd.gonderen_isim}</strong> sizi bu gruba davet etti.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleRespondGroupInvite(gd.davet_id, true)} style={{ background: '#00875A', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Kabul Et</button>
                        <button onClick={() => handleRespondGroupInvite(gd.davet_id, false)} style={{ background: '#E53935', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Reddet</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OYLANMAYI BEKLEYEN BULUŞMA TEKLİFLERİ */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0057FF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📬 Gelen Buluşma Teklifleri ({groupProposals.length})
              </h3>

              {groupProposals.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#5E6678' }}>Bekleyen yeni buluşma teklifi yok.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {groupProposals.map(prop => (
                    <div key={prop.id} style={{ background: '#F8F7F4', border: '1px solid #E6E4DD', padding: '14px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', color: '#14171F' }}>{prop.baslik}</strong>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0057FF', background: '#EBF1FF', padding: '2px 8px', borderRadius: '6px' }}>
                          {prop.grup_adi}
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: '#5E6678', margin: 0 }}>
                        👤 <strong>{prop.teklif_eden_isim}</strong> buluşmak istiyor • 🗓️ {prop.tarih} (🕒 {prop.baslangic_saat} - {prop.bitis_saat})
                      </p>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          onClick={() => handleRespondProposal(prop.id, true)}
                          style={{
                            flex: 1,
                            background: '#00875A',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <ThumbsUp size={14} /> Ben Varım (Takvime Ekle)
                        </button>

                        <button
                          onClick={() => handleRespondProposal(prop.id, false)}
                          style={{
                            flex: 1,
                            background: '#E53935',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <ThumbsDown size={14} /> Ben Yokum
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dahil Olduğum Gruplar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14171F', marginBottom: '16px' }}>
                🛡️ Dahil Olduğum Gruplar ({groups.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groups.map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8F7F4', borderRadius: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#14171F', display: 'block' }}>{g.grup_adi}</strong>
                      <span style={{ fontSize: '11px', color: '#5E6678' }}>{g.uye_sayisi} Üye • Davet Kodu: <code style={{ color: '#0057FF', fontWeight: 'bold' }}>{g.davet_kodu}</code></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sağ: Yeni Grup Kur & Katıl */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#14171F', marginBottom: '10px' }}>✨ Yeni Grup Kur</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newGroupName.trim()) return;
                await fetch(`${API_BASE}/api/groups/create`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ grup_adi: newGroupName.trim(), olusturan_id: user.id })
                });
                setNewGroupName('');
                fetchGroups();
              }} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Grup Adı"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px' }}>Oluştur</button>
              </form>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#14171F', marginBottom: '10px' }}>🔑 Davet Kodu ile Katıl</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!joinToken.trim()) return;
                const res = await fetch(`${API_BASE}/api/groups/join`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: joinToken.trim(), kullanici_id: user.id })
                });
                const data = await res.json();
                alert(data.message || data.detail);
                setJoinToken('');
                fetchGroups();
              }} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Davet Kodu (Örn: FLW-A1B2C3)"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px' }}>Katıl</button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SEKME: ARKADAŞLAR & GRUBA DOĞRUDAN DAVET ETME         */}
      {/* ======================================================== */}
      {activeTab === 'friends' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

          {/* Sol: Arkadaş Listesi + "Gruba Davet Et" Butonu */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14171F', marginBottom: '16px' }}>
              👥 Arkadaşlarım ({friendsData.arkadaslar.length})
            </h3>

            {friendsData.arkadaslar.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#5E6678' }}>Henüz ekli bir arkadaşınız bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {friendsData.arkadaslar.map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8F7F4', borderRadius: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#14171F', display: 'block' }}>{f.isim}</strong>
                      <span style={{ fontSize: '11px', color: '#5E6678' }}>@{f.kullanici_adi}</span>
                    </div>

                    {/* YENİ: ARKADAŞI GRUBA DAVET ET BUTONU */}
                    <button
                      onClick={() => {
                        setInviteModalFriend(f);
                        if (groups.length > 0) setSelectedGroupIdToInvite(groups[0].id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#EBF1FF',
                        border: '1px solid rgba(0,87,255,0.2)',
                        color: '#0057FF',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <UserPlus size={13} /> Gruba Davet Et
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Arkadaş Ekle & Gelen İstekler */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#14171F', marginBottom: '10px' }}>🔍 Yeni Arkadaş Ekle</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const res = await fetch(`${API_BASE}/api/friends/request`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ gonderen_id: user.id, hedef_kullanici_adi: newFriendUsername.trim() })
                });
                const d = await res.json();
                alert(d.message || d.detail);
                setNewFriendUsername('');
                fetchFriends();
              }} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Kullanıcı adı yazın (Örn: ahmet)"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px' }}>Gönder</button>
              </form>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#14171F', marginBottom: '10px' }}>📬 Gelen Arkadaşlık İstekleri ({friendsData.istekler.length})</h4>
              {friendsData.istekler.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#5E6678' }}>Bekleyen arkadaşlık isteği yok.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friendsData.istekler.map(req => (
                    <div key={req.istek_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8F7F4', borderRadius: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>@{req.kullanici_adi}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={async () => {
                          await fetch(`${API_BASE}/api/friends/respond`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ istek_id: req.istek_id, kabul_mu: true })
                          });
                          fetchFriends();
                        }} style={{ background: '#00875A', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><Check size={12} /></button>
                        <button onClick={async () => {
                          await fetch(`${API_BASE}/api/friends/respond`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ istek_id: req.istek_id, kabul_mu: false })
                          });
                          fetchFriends();
                        }} style={{ background: '#E53935', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><X size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* ARKADAŞI GRUBA DAVET ETME MODALI                         */}
      {/* ======================================================== */}
      {inviteModalFriend && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>👥 Gruba Davet Et</h2>
              <button className="close-btn" onClick={() => setInviteModalFriend(null)}>&times;</button>
            </div>

            <form onSubmit={handleInviteFriendToGroup} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: '#5E6678', margin: 0 }}>
                <strong>{inviteModalFriend.isim}</strong> (@{inviteModalFriend.kullanici_adi}) kullanıcısını hangi grubunuza davet etmek istiyorsunuz?
              </p>

              {groups.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#E53935' }}>Henüz dahil olduğunuz bir grup yok. Önce grup kurmalısınız.</p>
              ) : (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Grup Seçin
                  </label>
                  <select
                    value={selectedGroupIdToInvite}
                    onChange={(e) => setSelectedGroupIdToInvite(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px', fontWeight: '700' }}
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.grup_adi} ({g.uye_sayisi} Üye)</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={groups.length === 0}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '13px', marginTop: '6px' }}
              >
                Davet Gönder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* KİŞİSEL PLAN EKLEME MODALI                               */}
      {/* ======================================================== */}
      {isAddPlanModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2>🗓️ Yeni Plan Ekle ({selectedDay} Ağustos 2026)</h2>
              <button className="close-btn" onClick={() => setIsAddPlanModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddPersonalPlan} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Plan Başlığı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Diş Hekimi Randevusu"
                  value={planForm.baslik}
                  onChange={(e) => setPlanForm({ ...planForm, baslik: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6E4DD' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Başlangıç Saati
                  </label>
                  <input
                    type="time"
                    value={planForm.baslaSaat}
                    onChange={(e) => setPlanForm({ ...planForm, baslaSaat: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E6E4DD' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Bitiş Saati
                  </label>
                  <input
                    type="time"
                    value={planForm.bitisSaat}
                    onChange={(e) => setPlanForm({ ...planForm, bitisSaat: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E6E4DD' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px', fontSize: '13px' }}>
                Takvime Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}