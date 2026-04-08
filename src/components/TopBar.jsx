import { useAppStore } from '../store/useAppStore';
import ProfileModal from './modals/ProfileModal';

export default function TopBar() {
  const userDoc        = useAppStore(s => s.userDoc);
  const syncState      = useAppStore(s => s.syncState);
  const profileModal   = useAppStore(s => s.profileModal);
  const openProfile    = useAppStore(s => s.openProfileModal);

  const initial = (userDoc?.displayName || userDoc?.email || '?')[0].toUpperCase();

  return (
    <header className="topbar">
      <img src="/logo-cp2.svg" alt="Contado Pierde" className="topbar-logo-img" />

      <div className="topbar-right">
        <div className={`sync-dot ${syncState}`} title={syncState || 'sincronizado'} />

        <button className="topbar-user-btn" onClick={openProfile}>
          <div
            className="topbar-avatar"
            style={userDoc?.photoURL
              ? { backgroundImage: `url(${userDoc.photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: userDoc?.color ? `${userDoc.color}22` : 'var(--bg3)', color: userDoc?.color || 'var(--accent)' }
            }
          >
            {!userDoc?.photoURL && initial}
          </div>
          <span className="topbar-name">{userDoc?.displayName || 'Usuario'}</span>
          <span className="topbar-chevron">⌄</span>
        </button>
      </div>

      {profileModal && <ProfileModal />}
    </header>
  );
}
