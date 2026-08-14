import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Calendar from '../components/Calendar';
import Groups from '../components/Groups';
import Friends from '../components/Friends';
import SettingsModal from '../components/SettingsModal';
import InviteModal from '../components/InviteModal';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import GroupSettingsModal from '../components/GroupSettingsModal';

export default function Dashboard({ user, onLogout }) {
  // Modal Görünürlük Durumları
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  // Seçili Grup & Veri Durumları
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupsList, setGroupsList] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [commonTimeModal, setCommonTimeModal] = useState(null);

  // Kullanıcının üye olduğu grupları backend'den çek
  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/users/${user.id}/groups`);
      if (res.ok) {
        const data = await res.json();
        setGroupsList(data);
      }
    } catch (err) {
      console.error('Gruplar alınamadı:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups, refreshTrigger]);

  // Modal Açma Fonksiyonları
  const handleOpenInvite = (group) => {
    setSelectedGroup(group);
    setIsInviteOpen(true);
  };

  const handleOpenGroupSettings = (group) => {
    setSelectedGroup(group);
    setIsGroupSettingsOpen(true);
  };

  // Ortak Saat Hesaplama Modalı
  const handleFindCommonTime = async (groupId, groupName) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`/api/groups/${groupId}/common-slots?tarih=${today}`);
      if (res.ok) {
        const data = await res.json();
        setCommonTimeModal({
          groupId,
          groupName,
          tarih: data.tarih,
          slots: data.uygun_saat_araliklari,
          uyeSayisi: data.uye_sayisi,
        });
      }
    } catch {
      alert('Ortak saatler hesaplanamadı.');
    }
  };

  return (
    <div id="dashboard-screen" style={{ padding: '15px 20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ÜST NAVBAR */}
      <Navbar user={user} onOpenSettings={() => setIsSettingsOpen(true)} onLogout={onLogout} />

      {/* ANA 3 SÜTUNLU DÜZEN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '270px 1fr 340px',
          gap: '20px',
          alignItems: 'start',
          marginTop: '15px',
        }}
      >
        {/* SOL SÜTUN: Arkadaşlar & Davet İstekleri */}
        <Friends user={user} onGroupAction={() => setRefreshTrigger((p) => p + 1)} />

        {/* ORTA SÜTUN: Kişisel & Grup Takvimi */}
        <div className="card">
          <Calendar user={user} groups={groupsList} />
        </div>

        {/* SAĞ SÜTUN: Gruplar & Yönetim */}
        <Groups
          user={user}
          refreshTrigger={refreshTrigger}
          onOpenInvite={handleOpenInvite}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
          onOpenGroupSettings={handleOpenGroupSettings}
          onFindCommonTime={handleFindCommonTime}
        />
      </div>

      {/* --- MODALLER --- */}

      {/* 1. Ortak Uygun Saatler Modalı */}
      {commonTimeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>⚡ "{commonTimeModal.groupName}" Ortak Saatler</h2>
              <button className="close-btn" onClick={() => setCommonTimeModal(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                Tarih: <strong>{commonTimeModal.tarih}</strong> ({commonTimeModal.uyeSayisi} üyenin takvim analizi)
              </p>
              <div>
                {commonTimeModal.slots.map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#e6fffa',
                      border: '1px solid #38b2ac',
                      padding: '10px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      color: '#234e52',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    🟢 {slot}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Kullanıcı Profil Ayarları Modalı */}
      {isSettingsOpen && <SettingsModal user={user} onClose={() => setIsSettingsOpen(false)} />}

      {/* 3. Gruba Davet Et Modalı (Arkadaş Seçme / Link Kopyalama) */}
      {isInviteOpen && (
        <InviteModal
          user={user}
          group={selectedGroup}
          defaultInviteCode={selectedGroup?.davet_kodu}
          onClose={() => setIsInviteOpen(false)}
        />
      )}

      {/* 4. Grup Ayarları Modalı (Ad/Açıklama Düzenle & Grubu Sil) */}
      {isGroupSettingsOpen && (
        <GroupSettingsModal
          user={user}
          group={selectedGroup}
          onClose={() => setIsGroupSettingsOpen(false)}
          onUpdated={() => setRefreshTrigger((p) => p + 1)}
          onDeleted={() => setRefreshTrigger((p) => p + 1)}
        />
      )}

      {/* 5. Kod ile Gruba Katıl Modalı */}
      {isJoinGroupOpen && (
        <JoinGroupModal
          user={user}
          onClose={() => setIsJoinGroupOpen(false)}
          onGroupJoined={() => setRefreshTrigger((p) => p + 1)}
        />
      )}

      {/* 6. Yeni Grup Oluştur Modalı */}
      {isCreateGroupOpen && (
        <CreateGroupModal
          user={user}
          onClose={() => setIsCreateGroupOpen(false)}
          onGroupCreated={() => setRefreshTrigger((p) => p + 1)}
          onOpenInvite={() => handleOpenInvite(selectedGroup)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}
    </div>
  );
}