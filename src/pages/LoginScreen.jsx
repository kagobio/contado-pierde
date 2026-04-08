import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function LoginScreen() {
  const login = useAppStore(s => s.login);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <img src="/logo-cp2.svg" alt="Contado Pierde" className="login-logo-text" />
        <div className="login-brand-sub">Laboratorio Fotográfico</div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-title">Entrar</div>

        <div className="login-field">
          <label className="login-label">Email</label>
          <input
            className="login-input"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label className="login-label">Contraseña</label>
          <input
            className="login-input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="login-footer">
          ¿No tienes cuenta? Contacta con un administrador.
        </div>
      </form>
    </div>
  );
}

function getFriendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu red.';
    default:
      return 'Error al iniciar sesión. Inténtalo de nuevo.';
  }
}
