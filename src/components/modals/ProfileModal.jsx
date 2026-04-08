import { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';

const COLORS = [
  '#FF6B35','#FF4757','#2ED573','#3498DB','#9B59B6',
  '#F39C12','#1ABC9C','#E91E8C','#00BCD4','#8BC34A',
  '#FFD100','#FF6384','#36A2EB','#FFCE56','#4BC0C0',
];

export default function ProfileModal() {
  const userDoc       = useAppStore(s => s.userDoc);
  const closeModal    = useAppStore(s => s.closeProfileModal);
  const saveProfile   = useAppStore(s => s.saveProfile);
  const uploadAvatar  = useAppStore(s => s.uploadAvatar);
  const logout        = useAppStore(s => s.logout);
  const syncState     = useAppStore(s => s.syncState);

  const [name, setName]     = useState(userDoc?.displayName || '');
  const [color, setColor]   = useState(userDoc?.color || '#FF6B35');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const initial = (name || userDoc?.email || '?')[0].toUpperCase();

  function handleOverlay(e) {
    if (e.target === e.currentTarget) closeModal();
  }

  async function handleSave() {
    setSaving(true);
    await saveProfile({ displayName: name.trim() || userDoc.displayName, color });
    setSaving(false);
    closeModal();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('La foto no puede superar 3 MB');
      return;
    }
    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  }

  return (
    <div className="modal-overlay" onClick={handleOverlay} style={{ zIndex: 60 }}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '0 20px 20px' }}>
          <div
            className="profile-avatar-lg"
            style={userDoc?.photoURL
              ? { backgroundImage: `url(${userDoc.photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center', border: `3px solid ${color}` }
              : { background: `${color}22`, color, border: `3px solid ${color}` }
            }
            onClick={() => fileRef.current?.click()}
          >
            {!userDoc?.photoURL && initial}
            <div className="profile-avatar-overlay">
              {uploading ? <span className="spinner sm" /> : '📷'}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Toca la foto para cambiarla</div>
        </div>

        <div className="modal-body" style={{ paddingTop: 0 }}>
          {/* Name */}
          <div className="login-field">
            <label className="login-label">Nombre</label>
            <input
              className="login-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={40}
            />
          </div>

          {/* Color */}
          <div style={{ marginTop: 16 }}>
            <div className="login-label" style={{ marginBottom: 10 }}>Color de perfil</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`color-dot ${color === c ? 'active' : ''}`}
                  style={{ background: c, width: 28, height: 28 }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner sm" /> Guardando…</> : 'Guardar cambios'}
          </button>
          <button
            className="btn-ghost"
            style={{ color: 'var(--danger)', marginTop: 4 }}
            onClick={() => { closeModal(); logout(); }}
          >
            Cerrar sesión
          </button>
          <button className="btn-ghost" onClick={closeModal}>cancelar</button>
        </div>
      </div>
    </div>
  );
}
