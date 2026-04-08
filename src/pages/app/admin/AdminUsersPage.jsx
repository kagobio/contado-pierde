import { useEffect, useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';

const DEFAULT_PASSWORD = 'Contado2025!';

export default function AdminUsersPage() {
  const adminUsers      = useAppStore(s => s.adminUsers);
  const adminLoading    = useAppStore(s => s.adminLoading);
  const authUser        = useAppStore(s => s.authUser);
  const loadUsers       = useAppStore(s => s.loadAdminUsers);
  const setUserRole     = useAppStore(s => s.setUserRole);
  const adminCreateUser = useAppStore(s => s.adminCreateUser);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState({ displayName: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [created, setCreated]   = useState(null); // { displayName, email, password }

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
      // error already shown via toast
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-content">

      {/* Create user button */}
      {!showForm && (
        <button className="admin-add-btn" style={{ marginBottom: 12 }} onClick={() => setShowForm(true)}>
          + Añadir usuario
        </button>
      )}

      {/* Create user form */}
      {showForm && !created && (
        <form className="create-user-form" onSubmit={handleCreate}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Nuevo usuario</div>
          <input
            className="login-input"
            placeholder="Nombre"
            value={form.displayName}
            onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
            autoFocus
          />
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 0' }}>
            Contraseña por defecto: <strong style={{ color: 'var(--text)' }}>{DEFAULT_PASSWORD}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" type="submit" disabled={creating} style={{ flex: 1 }}>
              {creating ? <><span className="spinner sm" /> Creando…</> : 'Crear'}
            </button>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Success — show credentials to share */}
      {created && (
        <div className="create-user-success">
          <div style={{ fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>✓ Usuario creado</div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Comparte estos datos con <strong>{created.displayName}</strong>:</div>
          <div className="credentials-box">
            <div><span style={{ color: 'var(--muted)' }}>Email:</span> {created.email}</div>
            <div><span style={{ color: 'var(--muted)' }}>Contraseña:</span> {created.password}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            Se le pedirá cambiarla en el primer inicio de sesión.
          </div>
          <button className="btn-ghost" style={{ marginTop: 10 }} onClick={resetForm}>Cerrar</button>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        {adminUsers.length} usuarios registrados
      </div>

      {adminLoading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {adminUsers.map(user => (
        <div key={user.id} className="admin-user-row">
          <div
            className="admin-user-avatar"
            style={{ color: user.color || 'var(--accent)', border: `2px solid ${user.color || 'var(--border)'}` }}
          >
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
          <div className="admin-user-info">
            <div className="admin-user-name">
              {user.displayName || '—'}
              {user.mustChangePassword && (
                <span style={{ fontSize: 10, color: 'var(--warning)', marginLeft: 6, fontWeight: 600 }}>
                  pendiente contraseña
                </span>
              )}
            </div>
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
