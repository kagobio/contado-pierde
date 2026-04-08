import { useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';

export default function AdminUsersPage() {
  const adminUsers   = useAppStore(s => s.adminUsers);
  const adminLoading = useAppStore(s => s.adminLoading);
  const authUser     = useAppStore(s => s.authUser);
  const loadUsers    = useAppStore(s => s.loadAdminUsers);
  const setUserRole  = useAppStore(s => s.setUserRole);

  useEffect(() => { loadUsers(); }, []);

  return (
    <div className="admin-content">
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        {adminUsers.length} usuarios registrados. Las cuentas se crean desde Firebase Console o invitación directa.
      </div>

      {adminLoading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {adminUsers.map(user => (
        <div key={user.id} className="admin-user-row">
          <div
            className="admin-user-avatar"
            style={{ color: user.color || 'var(--accent)', borderColor: user.color || 'var(--border)', border: `2px solid ${user.color || 'var(--border)'}` }}
          >
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
          <div className="admin-user-info">
            <div className="admin-user-name">{user.displayName || '—'}</div>
            <div className="admin-user-email">{user.email}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
            {user.id !== authUser?.uid && (
              <button
                style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
                onClick={() => setUserRole(user.id, user.role === 'admin' ? 'member' : 'admin')}
              >
                {user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
