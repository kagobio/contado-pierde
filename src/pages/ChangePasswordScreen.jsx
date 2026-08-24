import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function ChangePasswordScreen() {
  const changePassword = useAppStore(s => s.changePassword);
  const userDoc        = useAppStore(s => s.userDoc);
  const [pass, setPass]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]  = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (pass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (pass !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await changePassword(pass);
    } catch (err) {
      setError('Error al cambiar la contraseña. Intenta cerrar sesión y volver a entrar.');
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <img src="/logo-voila.svg" alt="Voilà" className="login-logo-text" />
        <div className="login-brand-sub">Darkroom</div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center' }}>
          <div className="login-title" style={{ textAlign: 'center' }}>
            Hola{userDoc?.displayName ? `, ${userDoc.displayName}` : ''}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>
            Es tu primera vez. Elige una contraseña propia para continuar.
          </div>
        </div>

        <div className="login-field">
          <label className="login-label">Nueva contraseña</label>
          <input
            className="login-input"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={pass}
            onChange={e => setPass(e.target.value)}
            autoFocus
          />
        </div>

        <div className="login-field">
          <label className="login-label">Repetir contraseña</label>
          <input
            className="login-input"
            type="password"
            placeholder="Repite la contraseña"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? <><span className="spinner sm" /> Guardando…</> : 'Guardar y entrar'}
        </button>
      </form>
    </div>
  );
}
