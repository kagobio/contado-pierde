import { useEffect, useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';

export default function AdminUsersPage() {
  const adminUsers         = useAppStore(s => s.adminUsers);
  const adminLoading       = useAppStore(s => s.adminLoading);
  const authUser           = useAppStore(s => s.authUser);
  const loadUsers          = useAppStore(s => s.loadAdminUsers);
  const setUserRole        = useAppStore(s => s.setUserRole);
  const setUserTarifa      = useAppStore(s => s.setUserTarifa);
  const appConfig          = useAppStore(s => s.appConfig);
  const adminCreateUser    = useAppStore(s => s.adminCreateUser);
  const adminResetPassword = useAppStore(s => s.adminResetPassword);
  const adminDisableUser   = useAppStore(s => s.adminDisableUser);
  const adminEnableUser    = useAppStore(s => s.adminEnableUser);
  const adminDeleteUser    = useAppStore(s => s.adminDeleteUser);
  const adminRenewAccess   = useAppStore(s => s.adminRenewAccess);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ displayName: '', email: '', tarifa: 'tarifa1' });

  const [creating, setCreating] = useState(false);
  const [created, setCreated]   = useState(null);

  useEffect(() => { loadUsers(); }, []);

  function resetForm() {
    setForm({ displayName: '', email: '', tarifa: 'tarifa1' });
    setCreated(null);
    setShowForm(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.displayName.trim() || !form.email.trim()) return;
    setCreating(true);
    try {
      await adminCreateUser({ displayName: form.displayName, email: form.email, tarifa: form.tarifa });
      setCreated({ ...form });
      setForm({ displayName: '', email: '', tarifa: 'tarifa1' });
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
          <div className="tarifa-selector">
            {['tarifa1', 'tarifa2', 'tarifa3'].map(t => (
              <button
                key={t} type="button"
                className={`tarifa-chip ${form.tarifa === t ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, tarifa: t }))}
              >
                {appConfig?.tarifas?.[t]?.name || t}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '2px 0' }}>
            Recibirá un email para activar su cuenta.
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
          <div style={{ fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>✓ Invitación enviada</div>
          <div style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
            <strong>{created.displayName}</strong> recibirá un email en <strong>{created.email}</strong> con un enlace para establecer su contraseña y acceder a la app.
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.6 }}>
            Si no le llega, revisa la carpeta de spam o usa "Reset contraseña" desde su perfil.
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
                <span className="tarifa-badge" style={{ marginLeft: 6 }}>
                  {appConfig?.tarifas?.[user.tarifa || 'tarifa1']?.name || user.tarifa || 'Tarifa 1'}
                </span>
              </div>
              <div className="user-card-email">{user.email}</div>
              {user.expiresAt && (() => {
                const now = new Date();
                const expired = user.expiresAt < now;
                const soonMs = 7 * 24 * 60 * 60 * 1000;
                const expiringSoon = !expired && (user.expiresAt - now) < soonMs;
                const label = user.expiresAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                if (expired) return <div className="user-card-tag danger">Acceso caducado el {label}</div>;
                if (expiringSoon) return <div className="user-card-tag warning">Caduca el {label}</div>;
                return <div className="user-card-tag">Acceso hasta {label}</div>;
              })()}
              {user.mustChangePassword && !user.disabled && (
                <div className="user-card-tag warning">Pendiente de cambiar contraseña</div>
              )}
              {user.disabled && (
                <div className="user-card-tag danger">Cuenta desactivada</div>
              )}
            </div>
          </div>

          {/* Actions — only for other users */}
          {user.id !== authUser?.uid && (
            <div className="user-card-actions">
              <button className="user-action-btn"
                onClick={() => setUserRole(user.id, user.role === 'admin' ? 'member' : 'admin')}>
                {user.role === 'admin' ? '↓ Quitar admin' : '↑ Hacer admin'}
              </button>
              <button className="user-action-btn"
                onClick={() => {
                  const cycle = { tarifa1: 'tarifa2', tarifa2: 'tarifa3', tarifa3: 'tarifa1' };
                  const next = cycle[user.tarifa || 'tarifa1'] || 'tarifa2';
                  setUserTarifa(user.id, next);
                }}>
                ⇄ → {appConfig?.tarifas?.[(({ tarifa1: 'tarifa2', tarifa2: 'tarifa3', tarifa3: 'tarifa1' })[user.tarifa || 'tarifa1'])]?.name || 'siguiente'}
              </button>
              {user.expiresAt && (
                <button className="user-action-btn success"
                  onClick={() => adminRenewAccess(user.id, user.displayName)}>
                  ↻ Renovar acceso
                </button>
              )}
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
