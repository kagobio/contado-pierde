import { useEffect, useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';

const DEFAULT_PASSWORD = 'Contado2025!';
const USER_COLORS = [
  '#FF6B35','#FF4757','#2ED573','#3498DB','#9B59B6',
  '#F39C12','#1ABC9C','#E91E8C','#00BCD4','#8BC34A',
];

export default function AdminUsersPage() {
  const adminUsers         = useAppStore(s => s.adminUsers);
  const adminLoading       = useAppStore(s => s.adminLoading);
  const authUser           = useAppStore(s => s.authUser);
  const loadUsers          = useAppStore(s => s.loadAdminUsers);
  const setUserRole        = useAppStore(s => s.setUserRole);
  const adminCreateUser    = useAppStore(s => s.adminCreateUser);
  const adminResetPassword = useAppStore(s => s.adminResetPassword);
  const adminDisableUser   = useAppStore(s => s.adminDisableUser);
  const adminEnableUser    = useAppStore(s => s.adminEnableUser);
  const adminDeleteUser    = useAppStore(s => s.adminDeleteUser);
  const adminSetUserColor  = useAppStore(s => s.adminSetUserColor);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ displayName: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [created, setCreated]   = useState(null);

  useEffect(() => { loadUsers(); }, []);

  function resetForm() {
    setForm({ displayName: '', email: '' });
    setCreated(null);
    setShowForm(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.displayName.trim() || !form.email.trim()) return;
    setCreating(true);
    try {
      await adminCreateUser({ ...form, password: DEFAULT_PASSWORD });
      setCreated({ ...form, password: DEFAULT_PASSWORD });
      setForm({ displayName: '', email: '' });
    } catch {
      // shown via toast
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-content">

      {/* Create button */}
      {!showForm && (
        <button className="admin-add-btn" style={{ marginBottom: 12 }} onClick={() => setShowForm(true)}>
          + Añadir usuario
        </button>
      )}

      {/* Create form */}
      {showForm && !created && (
        <form className="create-user-form" onSubmit={handleCreate}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Nuevo usuario</div>
          <input className="login-input" placeholder="Nombre" value={form.displayName}
            onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} autoFocus />
          <input className="login-input" type="email" placeholder="Email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '2px 0' }}>
            Contraseña por defecto: <strong style={{ color: 'var(--text)' }}>{DEFAULT_PASSWORD}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" type="submit" disabled={creating} style={{ flex: 1 }}>
              {creating ? <><span className="spinner sm" /> Creando…</> : 'Crear'}
            </button>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Success */}
      {created && (
        <div className="create-user-success">
          <div style={{ fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>✓ Usuario creado</div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Comparte estos datos con <strong>{created.displayName}</strong>:</div>
          <div className="credentials-box">
            <div><span style={{ color: 'var(--muted)' }}>Email</span><br /><strong>{created.email}</strong></div>
            <div style={{ marginTop: 8 }}><span style={{ color: 'var(--muted)' }}>Contraseña</span><br /><strong>{created.password}</strong></div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            Se le pedirá cambiarla en el primer inicio de sesión.
          </div>
          <button className="btn-ghost" style={{ marginTop: 10 }} onClick={resetForm}>Cerrar</button>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
        {adminUsers.length} usuarios registrados
      </div>

      {adminLoading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {adminUsers.map(user => (
        <div key={user.id} className="user-card">
          {/* Header */}
          <div className="user-card-header">
            <div className="user-card-avatar" style={{ background: `${user.color || '#ff6b35'}22`, color: user.color || '#ff6b35' }}>
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <div className="user-card-info">
              <div className="user-card-name">
                {user.displayName || '—'}
                <span className={`role-badge ${user.role}`} style={{ marginLeft: 8 }}>{user.role}</span>
              </div>
              <div className="user-card-email">{user.email}</div>
              {user.mustChangePassword && !user.disabled && (
                <div className="user-card-tag warning">Pendiente de cambiar contraseña</div>
              )}
              {user.disabled && (
                <div className="user-card-tag danger">Cuenta desactivada</div>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div className="user-color-picker">
            {USER_COLORS.map(c => (
              <button
                key={c}
                className={`color-dot ${user.color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => adminSetUserColor(user.id, c)}
              />
            ))}
          </div>

          {/* Actions — only for other users */}
          {user.id !== authUser?.uid && (
            <div className="user-card-actions">
              <button className="user-action-btn"
                onClick={() => setUserRole(user.id, user.role === 'admin' ? 'member' : 'admin')}>
                {user.role === 'admin' ? '↓ Quitar admin' : '↑ Hacer admin'}
              </button>
              <button className="user-action-btn"
                onClick={() => adminResetPassword(user.email)}>
                ✉ Reset contraseña
              </button>
              {user.disabled
                ? <button className="user-action-btn success" onClick={() => adminEnableUser(user.id, user.displayName)}>
                    ✓ Reactivar
                  </button>
                : <button className="user-action-btn warning" onClick={() => adminDisableUser(user.id, user.displayName)}>
                    ⊘ Desactivar
                  </button>
              }
              <button className="user-action-btn danger" onClick={() => adminDeleteUser(user.id, user.displayName)}>
                ✕ Eliminar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
