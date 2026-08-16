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
  Edit2,
  Info,
  AlertTriangle,
  KeyRound,
  PlusCircle,
  Coffee,
  Shield,
  Mail,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function Calendar({ user }) {
  const [activeTab, setActiveTab] = useState('personal');

  // Token ve API Adresi
  const token = user?.access_token || user?.token || localStorage.getItem('token') || '';
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

  // Güvenli Fetch Yardımcısı (JWT Token ekler)
  const authFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  };

  // Canlı Tarih Yönetimi
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const todayDateNumber = today.getDate();

  const [selectedDay, setSelectedDay] = useState(todayDateNumber);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(currentMonth);
  const [currentYearVal, setCurrentYearVal] = useState(currentYear);

  // Formatlı Tarih Dizgisi (YYYY-MM-DD)
  const formattedMonth = String(currentMonthIndex + 1).padStart(2, '0');
  const formattedDay = String(selectedDay).padStart(2, '0');
  const selectedDateStr = `${currentYearVal}-${formattedMonth}-${formattedDay}`;

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const daysInCurrentMonth = new Date(currentYearVal, currentMonthIndex + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYearVal((prev) => prev - 1);
    } else {
      setCurrentMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYearVal((prev) => prev + 1);
    } else {
      setCurrentMonthIndex((prev) => prev + 1);
    }
  };

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

  const [inviteModalFriend, setInviteModalFriend] = useState(null);
  const [selectedGroupIdToInvite, setSelectedGroupIdToInvite] = useState('');

  // Grup Düzenleme Modalı State'leri
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');

  const [proposalTitle, setProposalTitle] = useState('');
  const [selectedSlotForProposal, setSelectedSlotForProposal] = useState('');
  const [showProposalBox, setShowProposalBox] = useState(false);

  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [joinToken, setJoinToken] = useState('');

  // Özel Bildirim & Onay Modalı State'i
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    isDanger: false,
    onConfirm: null
  });

  const showAlert = (message, title = 'Bilgilendirme') => {
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      isDanger: false,
      onConfirm: null
    });
  };

  const showConfirm = (message, onConfirm, title = 'Onay Gerekli', isDanger = true) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      isDanger,
      onConfirm
    });
  };

  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  // API İstekleri (JWT Token Korumalı)
  const fetchEvents = async () => {
    try {
      const res = await authFetch('/api/users/events');
      if (res.ok) setEvents(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchFriends = async () => {
    try {
      const res = await authFetch('/api/users/friends');
      if (res.ok) setFriendsData(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchGroups = async () => {
    try {
      const res = await authFetch('/api/users/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroup) setSelectedGroup(data[0]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchProposals = async () => {
    try {
      const res = await authFetch('/api/users/group-proposals');
      if (res.ok) setGroupProposals(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchGroupCalendarData = async () => {
    if (!selectedGroup) return;
    try {
      const timelineRes = await authFetch(`/api/groups/${selectedGroup.id}/timeline?tarih=${selectedDateStr}`);
      if (timelineRes.ok) {
        const tData = await timelineRes.json();
        setGroupTimeline(tData.uyeler || []);
      }

      const slotsRes = await authFetch(`/api/groups/${selectedGroup.id}/common-slots?tarih=${selectedDateStr}`);
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
  }, [activeTab, selectedGroup, selectedDay, currentMonthIndex, currentYearVal]);

  const handleAddPersonalPlan = async (e) => {
    e.preventDefault();
    if (!planForm.baslik.trim()) return;

    const baslangic = `${selectedDateStr}T${planForm.baslaSaat}:00`;
    const bitis = `${selectedDateStr}T${planForm.bitisSaat}:00`;

    try {
      const res = await authFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
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
        showAlert(data.detail || 'Plan eklenemedi.', 'Hata');
      }
    } catch {
      showAlert('Sunucu hatası oluştu.', 'Hata');
    }
  };

  const handleDeleteEvent = (id) => {
    showConfirm(
      'Bu planı silmek istediğinize emin misiniz?',
      async () => {
        try {
          const res = await authFetch(`/api/events/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchEvents();
            if (selectedGroup) fetchGroupCalendarData();
          }
        } catch (e) { console.error(e); }
      },
      'Planı Sil',
      true
    );
  };

  const handleSendProposal = async () => {
    if (!proposalTitle.trim() || !selectedSlotForProposal) {
      showAlert('Lütfen bir başlık yazın ve saat aralığı seçin.', 'Eksik Bilgi');
      return;
    }
    const [start, end] = selectedSlotForProposal.split(' - ');

    try {
      const res = await authFetch('/api/groups/propose-plan', {
        method: 'POST',
        body: JSON.stringify({
          grup_id: selectedGroup.id,
          baslik: proposalTitle.trim(),
          tarih: selectedDateStr,
          baslangic_saat: start,
          bitis_saat: end
        })
      });

      if (res.ok) {
        showAlert('Buluşma teklifi gruba iletildi! Diğer üyeler oylayabilir.', 'Teklif Gönderildi');
        setProposalTitle('');
        setShowProposalBox(false);
        fetchProposals();
      }
    } catch {
      showAlert('Teklif gönderilemedi.', 'Hata');
    }
  };

  const handleRespondProposal = async (teklifId, kabulMu) => {
    try {
      const res = await authFetch('/api/groups/respond-proposal', {
        method: 'POST',
        body: JSON.stringify({
          teklif_id: teklifId,
          kabul_mu: kabulMu
        })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'Yanıt İletildi');
        fetchProposals();
        fetchEvents();
      }
    } catch {
      showAlert('İşlem başarısız.', 'Hata');
    }
  };

  const handleInviteFriendToGroup = async (e) => {
    e.preventDefault();
    if (!selectedGroupIdToInvite || !inviteModalFriend) return;

    try {
      const res = await authFetch('/api/groups/invite-friend', {
        method: 'POST',
        body: JSON.stringify({
          grup_id: parseInt(selectedGroupIdToInvite),
          davet_edilen_id: inviteModalFriend.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        showAlert(`${inviteModalFriend.isim} kullanıcısına grup daveti başarıyla iletildi!`, 'Davet Gönderildi');
        setInviteModalFriend(null);
        setSelectedGroupIdToInvite('');
      } else {
        showAlert(data.detail || 'Davet gönderilemedi.', 'Hata');
      }
    } catch {
      showAlert('Sunucu hatası oluştu.', 'Hata');
    }
  };

  const handleRespondGroupInvite = async (davetId, kabulMu) => {
    try {
      const res = await authFetch('/api/groups/respond-invite', {
        method: 'POST',
        body: JSON.stringify({
          davet_id: davetId,
          kabul_mu: kabulMu
        })
      });
      const data = await res.json();
      showAlert(data.message, 'Grup Daveti');
      fetchFriends();
      fetchGroups();
    } catch {
      showAlert('İşlem başarısız.', 'Hata');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim() || !editingGroup) return;

    try {
      const res = await authFetch(`/api/groups/${editingGroup.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          grup_adi: editGroupName.trim(),
          aciklama: editingGroup.aciklama || ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'Başarılı');
        setEditingGroup(null);
        fetchGroups();
      } else {
        showAlert(data.detail || 'Grup güncellenemedi.', 'Hata');
      }
    } catch {
      showAlert('Sunucu hatası oluştu.', 'Hata');
    }
  };

  const handleDeleteGroup = (grupId) => {
    showConfirm(
      'Bu grubu silmek istediğinize emin misiniz? Gruptaki tüm üyeler ve etkinlik bağlantıları kaldırılacaktır.',
      async () => {
        try {
          const res = await authFetch(`/api/groups/${grupId}`, {
            method: 'DELETE'
          });

          const data = await res.json();
          if (res.ok) {
            showAlert(data.message, 'Grup Silindi');
            fetchGroups();
          } else {
            showAlert(data.detail || 'Grup silinemedi.', 'Hata');
          }
        } catch {
          showAlert('Sunucu hatası oluştu.', 'Hata');
        }
      },
      'Grubu Sil',
      true
    );
  };

  const selectedDayEvents = events.filter(e => e.baslangic.startsWith(selectedDateStr));
  const totalGroupNotifications = (friendsData.grup_istekleri?.length || 0) + groupProposals.length;

  const tabKeys = ['personal', 'group_calendar', 'friends', 'groups'];
  const activeTabIndex = Math.max(0, tabKeys.indexOf(activeTab));

  const renderMonthGrid = () => (
    <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #F0EFEA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={handlePrevMonth} style={{ border: 'none', background: '#F8F7F4', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#14171F' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#14171F', minWidth: '130px', textAlign: 'center' }}>
            {monthNames[currentMonthIndex]} {currentYearVal}
          </span>
          <button onClick={handleNextMonth} style={{ border: 'none', background: '#F8F7F4', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#14171F' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        <span style={{ fontSize: '12px', fontWeight: '700', color: '#949DAE' }}>
          {daysInCurrentMonth} Gün
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
        {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map(d => (
          <span key={d} style={{ fontSize: '11px', fontWeight: '800', color: '#949DAE' }}>{d}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(day => {
          const isToday =
            day === todayDateNumber &&
            currentMonthIndex === today.getMonth() &&
            currentYearVal === today.getFullYear();

          const isSelected = day === selectedDay;
          const checkDateStr = `${currentYearVal}-${formattedMonth}-${String(day).padStart(2, '0')}`;
          const hasEvent = events.some(e => e.baslangic.startsWith(checkDateStr));

          return (
            <div
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                minHeight: '65px',
                borderRadius: '12px',
                padding: '8px',
                cursor: 'pointer',
                background: isSelected ? '#EBF1FF' : '#F8F7F4',
                border: isSelected ? '2px solid #0057FF' : '1px solid #E6E4DD',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: isSelected ? '#0057FF' : '#14171F' }}>
                  {day < 10 ? `0${day}` : day}
                </span>
                {isToday && (
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
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ÜST GEZİNME ÇUBUĞU */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

        {/* KAYAN ANİMASYONLU 4 ANA SEKME */}
        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            position: 'relative',
            background: '#FFFFFF',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid #E6E4DD'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: '4px',
              width: 'calc((100% - 8px) / 4)',
              background: '#0057FF',
              borderRadius: '10px',
              transform: `translateX(${activeTabIndex * 100}%)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          <button
            onClick={() => setActiveTab('personal')}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: 'transparent',
              color: activeTab === 'personal' ? '#FFFFFF' : '#5E6678',
              transition: 'color 0.2s'
            }}
          >
            <CalendarIcon size={15} /> Kişisel Takvim
          </button>

          <button
            onClick={() => setActiveTab('group_calendar')}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: 'transparent',
              color: activeTab === 'group_calendar' ? '#FFFFFF' : '#5E6678',
              transition: 'color 0.2s'
            }}
          >
            <Users size={15} /> Grup Takvimi
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: 'transparent',
              color: activeTab === 'friends' ? '#FFFFFF' : '#5E6678',
              transition: 'color 0.2s'
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
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: 'transparent',
              color: activeTab === 'groups' ? '#FFFFFF' : '#5E6678',
              transition: 'color 0.2s'
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

        {/* Sağ: Plan Ekle Butonu */}
        <button
          onClick={() => setIsAddPlanModalOpen(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}
        >
          <Plus size={16} /> Plan Ekle
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. SEKME: KİŞİSEL TAKVİM                                 */}
      {/* ======================================================== */}
      {activeTab === 'personal' && (
        <div className="tab-content-animated" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
          {renderMonthGrid()}

          {/* Sağ: Günün Detayı */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <CalendarIcon size={18} color="#0057FF" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14171F', margin: 0 }}>
                  {selectedDay} {monthNames[currentMonthIndex]} {currentYearVal}
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#5E6678' }}>
                {selectedDayEvents.length} kayıtlı kişisel plan
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', background: '#F8F7F4', borderRadius: '16px', border: '1px dashed #E6E4DD' }}>
                <Coffee size={28} color="#949DAE" style={{ margin: '0 auto' }} />
                <p style={{ fontSize: '13px', color: '#5E6678', marginTop: '8px', margin: 0 }}>Bu güne ait kayıtlı planınız yok.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {selectedDayEvents.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8F7F4', borderRadius: '10px', borderLeft: '4px solid #0057FF' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#14171F', display: 'block' }}>{e.baslik}</strong>
                      <span style={{ fontSize: '11px', color: '#5E6678', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={11} /> {e.baslangic.substring(11, 16)} - {e.bitis.substring(11, 16)}
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
      {/* 2. SEKME: GRUP TAKVİMİ                                   */}
      {/* ======================================================== */}
      {activeTab === 'group_calendar' && (
        <div className="tab-content-animated" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

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

            <div style={{ fontSize: '11px', color: '#5E6678', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#0057FF" /> 24 saatlik akıllı grup boş zaman eşleştiricisi aktif.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
            {renderMonthGrid()}

            {/* Sağ: Grup Meşguliyet & Teklif Formu */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <CalendarIcon size={18} color="#0057FF" />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14171F', margin: 0 }}>
                    {selectedDay} {monthNames[currentMonthIndex]} {currentYearVal} — {selectedGroup?.grup_adi}
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: '#5E6678' }}>Üyelerin 24 saatlik meşguliyet durumu</span>
              </div>

              {/* Meşguliyet Listesi (Madde 11: Özel başlıklar gizli) */}
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
                          {uye.isim} (@{uye.kullanici_adi})
                        </span>
                        {hasEvents ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {uye.etkinlikler.map(e => (
                              <span key={e.id} style={{ background: '#FEECEB', color: '#E53935', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <AlertCircle size={10} /> {e.baslangic} - {e.bitis} (Dolu)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#00875A', fontSize: '11px', fontWeight: '700', background: '#D4F7DC', padding: '2px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> Tüm Gün Müsait
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

              {/* Teklif Formu */}
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
      {/* 3. SEKME: GRUPLARIM                                      */}
      {/* ======================================================== */}
      {activeTab === 'groups' && (
        <div className="tab-content-animated" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Gelen Grup Katılım Davetleri */}
            {friendsData.grup_istekleri?.length > 0 && (
              <div style={{ background: '#FFF8E6', border: '1px solid #FFE082', borderRadius: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Mail size={17} color="#B78103" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#B78103', margin: 0 }}>
                    Gelen Grup Katılım Davetleri ({friendsData.grup_istekleri.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friendsData.grup_istekleri.map(gd => (
                    <div key={gd.davet_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #FFE082' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#14171F', display: 'block' }}>{gd.grup_adi}</strong>
                        <span style={{ fontSize: '11px', color: '#5E6678' }}><strong>{gd.gonderen_isim}</strong> sizi bu gruba davet etti.</span>
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

            {/* Bekleyen Buluşma Teklifleri */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Clock size={18} color="#0057FF" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0057FF', margin: 0 }}>
                  Gelen Buluşma Teklifleri ({groupProposals.length})
                </h3>
              </div>

              {groupProposals.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#5E6678', margin: 0 }}>Bekleyen yeni buluşma teklifi yok.</p>
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
                        <strong>{prop.teklif_eden_isim}</strong> buluşmak istiyor • {prop.tarih} ({prop.baslangic_saat} - {prop.bitis_saat})
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Shield size={18} color="#0057FF" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14171F', margin: 0 }}>
                  Dahil Olduğum Gruplar ({groups.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groups.map(g => {
                  const isOwner = g.olusturan_id === user?.id;

                  return (
                    <div
                      key={g.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: '#F8F7F4',
                        borderRadius: '12px',
                        border: isOwner ? '1px solid #C7DBFF' : '1px solid #E6E4DD'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#14171F' }}>{g.grup_adi}</strong>
                          {isOwner && (
                            <span style={{ fontSize: '10px', fontWeight: '800', background: '#EBF1FF', color: '#0057FF', padding: '2px 6px', borderRadius: '6px' }}>
                              KURUCU
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#5E6678' }}>
                          {g.uye_sayisi} Üye • Davet Kodu: <code style={{ color: '#0057FF', fontWeight: 'bold' }}>{g.davet_kodu}</code>
                        </span>
                      </div>

                      {isOwner && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEditingGroup(g);
                              setEditGroupName(g.grup_adi);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#FFFFFF',
                              border: '1px solid #E6E4DD',
                              color: '#14171F',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={12} /> Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(g.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#FEECEB',
                              border: '1px solid #FCA5A5',
                              color: '#E53935',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} /> Sil
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sağ: Yeni Grup Kur & Katıl */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <PlusCircle size={17} color="#0057FF" />
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#14171F', margin: 0 }}>Yeni Grup Kur</h4>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newGroupName.trim()) return;
                try {
                  const res = await authFetch('/api/groups/create', {
                    method: 'POST',
                    body: JSON.stringify({ grup_adi: newGroupName.trim() })
                  });
                  const d = await res.json();
                  if (res.ok) {
                    showAlert(`"${newGroupName}" grubu başarıyla kuruldu! Davet kodunuz: ${d.davet_kodu}`, 'Grup Kuruldu');
                    setNewGroupName('');
                    fetchGroups();
                  } else {
                    showAlert(d.detail || 'Grup oluşturulamadı.', 'Hata');
                  }
                } catch {
                  showAlert('Sunucu hatası oluştu.', 'Hata');
                }
              }} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Grup Adı"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ flex: 1, height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ minWidth: '95px', height: '42px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}
                >
                  Oluştur
                </button>
              </form>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <KeyRound size={17} color="#0057FF" />
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#14171F', margin: 0 }}>Davet Kodu ile Katıl</h4>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!joinToken.trim()) return;
                try {
                  const res = await authFetch('/api/groups/join', {
                    method: 'POST',
                    body: JSON.stringify({ token: joinToken.trim() })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    showAlert(data.message, 'Gruba Katıldınız');
                    setJoinToken('');
                    fetchGroups();
                  } else {
                    showAlert(data.detail || 'Gruba katılınamadı.', 'Hata');
                  }
                } catch {
                  showAlert('Sunucu hatası oluştu.', 'Hata');
                }
              }} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Davet Kodu (Örn: FLW-A1B2C3)"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  style={{ flex: 1, height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ minWidth: '95px', height: '42px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}
                >
                  Katıl
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SEKME: ARKADAŞLAR                                     */}
      {/* ======================================================== */}
      {activeTab === 'friends' && (
        <div className="tab-content-animated" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>

          <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Users size={18} color="#0057FF" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14171F', margin: 0 }}>
                Arkadaşlarım ({friendsData.arkadaslar.length})
              </h3>
            </div>

            {friendsData.arkadaslar.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#5E6678', margin: 0 }}>Henüz ekli bir arkadaşınız bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {friendsData.arkadaslar.map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8F7F4', borderRadius: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#14171F', display: 'block' }}>{f.isim}</strong>
                      <span style={{ fontSize: '11px', color: '#5E6678' }}>@{f.kullanici_adi}</span>
                    </div>

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

          {/* Sağ: Yeni Arkadaş Ekle & İstekler */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Search size={17} color="#0057FF" />
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#14171F', margin: 0 }}>Yeni Arkadaş Ekle</h4>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await authFetch('/api/friends/request', {
                    method: 'POST',
                    body: JSON.stringify({ hedef_kullanici_adi: newFriendUsername.trim() })
                  });
                  const d = await res.json();
                  if (res.ok) {
                    showAlert(d.message, 'İstek Gönderildi');
                    setNewFriendUsername('');
                    fetchFriends();
                  } else {
                    showAlert(d.detail || 'İstek gönderilemedi.', 'Hata');
                  }
                } catch {
                  showAlert('Sunucu hatası oluştu.', 'Hata');
                }
              }} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Kullanıcı adı yazın (Örn: ahmet)"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  style={{ flex: 1, height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ minWidth: '95px', height: '42px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}
                >
                  Gönder
                </button>
              </form>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E6E4DD', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Mail size={17} color="#0057FF" />
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#14171F', margin: 0 }}>Gelen Arkadaşlık İstekleri ({friendsData.istekler.length})</h4>
              </div>

              {friendsData.istekler.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#5E6678', margin: 0 }}>Bekleyen arkadaşlık isteği yok.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friendsData.istekler.map(req => (
                    <div key={req.istek_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8F7F4', borderRadius: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>@{req.kullanici_adi}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={async () => {
                          await authFetch('/api/friends/respond', {
                            method: 'POST',
                            body: JSON.stringify({ istek_id: req.istek_id, kabul_mu: true })
                          });
                          fetchFriends();
                        }} style={{ background: '#00875A', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><Check size={12} /></button>
                        <button onClick={async () => {
                          await authFetch('/api/friends/respond', {
                            method: 'POST',
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
      {/* MODALLAR                                                 */}
      {/* ======================================================== */}

      {/* 1. ÖZEL BİLDİRİM & ONAY PENCERESİ */}
      {dialogConfig.isOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E6E4DD',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'tabFadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: dialogConfig.isDanger ? '#FEECEB' : '#EBF1FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: dialogConfig.isDanger ? '#E53935' : '#0057FF'
                }}
              >
                {dialogConfig.isDanger ? <AlertTriangle size={22} /> : <Info size={22} />}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#14171F', margin: 0 }}>
                {dialogConfig.title}
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#5E6678', lineHeight: '1.5', margin: '4px 0 12px 0' }}>
              {dialogConfig.message}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {dialogConfig.type === 'confirm' && (
                <button
                  type="button"
                  onClick={closeDialog}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #E6E4DD',
                    background: '#F8F7F4',
                    color: '#5E6678',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (dialogConfig.onConfirm) {
                    dialogConfig.onConfirm();
                  }
                  closeDialog();
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: dialogConfig.isDanger ? '#E53935' : '#0057FF',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: dialogConfig.isDanger
                    ? '0 4px 12px rgba(229, 57, 53, 0.25)'
                    : '0 4px 12px rgba(0, 87, 255, 0.25)'
                }}
              >
                {dialogConfig.type === 'confirm' ? 'Evet, Onayla' : 'Tamam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GRUP DÜZENLEME MODALI */}
      {editingGroup && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div className="modal-content" style={{ maxWidth: '400px', background: '#FFF', borderRadius: '20px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit2 size={16} color="#0057FF" />
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>Grubu Düzenle</h2>
              </div>
              <button className="close-btn" onClick={() => setEditingGroup(null)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleUpdateGroup} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#5E6678', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Grup Adı
                </label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6E4DD', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  style={{ background: '#F8F7F4', border: '1px solid #E6E4DD', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ARKADAŞI GRUBA DAVET ET MODALI */}
      {inviteModalFriend && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div className="modal-content" style={{ maxWidth: '400px', background: '#FFF', borderRadius: '20px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserPlus size={16} color="#0057FF" />
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>Gruba Davet Et</h2>
              </div>
              <button className="close-btn" onClick={() => setInviteModalFriend(null)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
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

      {/* 4. PLAN EKLEME MODALI */}
      {isAddPlanModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div className="modal-content" style={{ maxWidth: '420px', background: '#FFF', borderRadius: '20px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarIcon size={16} color="#0057FF" />
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>Yeni Plan Ekle ({selectedDay} {monthNames[currentMonthIndex]} {currentYearVal})</h2>
              </div>
              <button className="close-btn" onClick={() => setIsAddPlanModalOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
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