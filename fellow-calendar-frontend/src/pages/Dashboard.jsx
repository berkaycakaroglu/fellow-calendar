import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Calendar from '../components/Calendar';
import Groups from '../components/Groups';
import SettingsModal from '../components/SettingsModal';
import InviteModal from '../components/InviteModal';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Dashboard({ user, onLogout }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  return (
    <div id="dashboard-screen" style={{ padding: '20px' }}>
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-layout">
        <div className="left-panel card">
          <h3>📅 Kişisel Takvimim</h3>
          <Calendar />
        </div>

        <Groups
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenInvite={() => setIsInviteOpen(true)}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        />
      </div>

      {isSettingsOpen && <SettingsModal user={user} onClose={() => setIsSettingsOpen(false)} />}
      {isInviteOpen && <InviteModal onClose={() => setIsInviteOpen(false)} />}
      {isCreateGroupOpen && (
        <CreateGroupModal
          user={user}
          onClose={() => setIsCreateGroupOpen(false)}
          onGroupCreated={() => console.log('Grup yenilendi')}
          onOpenInvite={() => setIsInviteOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}
    </div>
  );
}