import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { REQUEST_SLOTS } from '../constants';
import { todayStr } from '../utils';

export default function RequestScreen() {
  const submitRequest = useAppStore(s => s.submitRequest);

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [date, setDate]       = useState('');
  const [slot, setSlot]       = useState('');
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !date || !slot) {
      setError('Completa nombre, email, día y franja horaria.');
      return;
    }
    setLoading(true);
    try {
      await submitRequest({
        name:  name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        date,
        slot,
        note:  note.trim(),
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      setError('No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="login-screen">
        <div className="login-brand">
          <img src="/logo-voila.svg" alt="Voilà" className="login-logo-text" />
          <div className="login-brand-sub">Darkroom</div>
        </div>
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="request-success-icon">
            <svg viewBox="0 0 24 24" className="request-success-check"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="login-title" style={{ textAlign: 'center' }}>Solicitud enviada</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.55 }}>
            La hemos recibido correctamente. Revisaremos la disponibilidad y te
            escribiremos a <b style={{ color: 'var(--text)' }}>{email}</b> para confirmarla.
          </div>
          <button
            className="login-btn"
            style={{ marginTop: 8 }}
            onClick={() => {
              setDone(false);
              setName(''); setEmail(''); setPhone('');
              setDate(''); setSlot(''); setNote('');
            }}
          >
            Enviar otra solicitud
          </button>
          <div className="login-footer">
            <a href="/" style={{ color: 'var(--text2)' }}>← Acceso socios</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <img src="/logo-voila.svg" alt="Voilà" className="login-logo-text" />
        <div className="login-brand-sub">Darkroom</div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <div className="login-title">Reservar una sesión</div>
          <p className="request-intro">
            Para clientes puntuales. Elige el día y la franja; revisamos la
            disponibilidad y te confirmamos por email.
          </p>
        </div>

        <div className="login-field">
          <label className="login-label">Nombre</label>
          <input className="login-input" type="text" placeholder="Tu nombre"
            value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="login-field">
          <label className="login-label">Email</label>
          <input className="login-input" type="email" autoComplete="email" placeholder="tu@email.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="login-field">
          <label className="login-label">Teléfono <span className="field-optional">· opcional</span></label>
          <input className="login-input" type="tel" autoComplete="tel" placeholder="600 000 000"
            value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div className="login-field">
          <label className="login-label">Día</label>
          <input className="login-input" type="date" min={todayStr()}
            value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        <div className="login-field">
          <label className="login-label">Franja horaria</label>
          <div className="slot-toggle">
            {REQUEST_SLOTS.map(s => (
              <button
                type="button"
                key={s.id}
                className={`slot-toggle-btn ${slot === s.id ? 'selected' : ''}`}
                onClick={() => setSlot(s.id)}
                aria-pressed={slot === s.id}
              >
                <span className="slot-toggle-label">{s.label}</span>
                <span className="slot-toggle-time">{s.time}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="login-field">
          <label className="login-label">Comentario <span className="field-optional">· opcional</span></label>
          <textarea className="login-input" style={{ minHeight: 68, resize: 'vertical' }}
            placeholder="Cuéntanos lo que necesites…"
            value={note} onChange={e => setNote(e.target.value)} maxLength={300} />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? <><span className="spinner sm" /> Enviando…</> : 'Enviar solicitud'}
        </button>

        <div className="login-footer">
          <a href="/" style={{ color: 'var(--text2)' }}>← Acceso socios</a>
        </div>
      </form>
    </div>
  );
}
