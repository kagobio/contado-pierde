import { useAppStore } from '../store/useAppStore';

export default function TopBar() {
  const userDoc  = useAppStore(s => s.userDoc);
  const syncState = useAppStore(s => s.syncState);
  const logout   = useAppStore(s => s.logout);

  const initial = (userDoc?.displayName || userDoc?.email || '?')[0].toUpperCase();

  function handleUserClick() {
    if (confirm(`Sesión de ${userDoc?.displayName || userDoc?.email}\n\n¿Cerrar sesión?`)) {
      logout();
    }
  }

  return (
    <header className="topbar">
      <img src="/logo-cp2.svg" alt="Contado Pierde" className="topbar-logo-img" />

      <div className="topbar-right">
        <div className={`sync-dot ${syncState}`} title={syncState || 'sincronizado'} />

        <button className="topbar-user-btn" onClick={handleUserClick}>
          <div
            className="topbar-avatar"
            style={{ background: userDoc?.color ? `${userDoc.color}22` : 'var(--bg3)', color: userDoc?.color || 'var(--accent)' }}
          >
            {initial}
          </div>
          <span className="topbar-name">{userDoc?.displayName || 'Usuario'}</span>
          <span className="topbar-chevron">⌄</span>
        </button>
      </div>
    </header>
  );
}
