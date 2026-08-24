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
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>¡Solicitud enviada!</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
            Hemos recibido tu solicitud. Revisaremos la disponibilidad y te enviaremos
            un correo de confirmación a <b style={{ color: 'var(--text)' }}>{email}</b>.
          </div>
          <button
            className="login-btn"
            style={{ marginTop: 20 }}
            onClick={() => {
              setDone(false);
              setName(''); setEmail(''); setPhone('');
              setDate(''); setSlot(''); setNote('');
            }}
          >
            Enviar otra solicitud
          </button>
          <div className="login-footer" style={{ marginTop: 14 }}>
            <a href="/" style={{ color: 'var(--text2)', textDecoration: 'none' }}>← Acceso socios</a>
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
        <div className="login-title">Solicitar sesión</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: -4, marginBottom: 4, lineHeight: 1.4 }}>
          Para clientes puntuales. Elige día y franja; te confirmamos por email.
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
          <label className="login-label">Teléfono <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
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
          <div style={{ display: 'flex', gap: 10 }}>
            {REQUEST_SLOTS.map(s => {
              const selected = slot === s.id;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSlot(s.id)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    borderRadius: 12,
                    border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border2)'}`,
                    background: selected ? 'var(--accent-dim)' : 'var(--bg3)',
                    color: 'var(--text)',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color: selected ? 'var(--accent)' : 'var(--text)' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.time}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="login-field">
          <label className="login-label">Comentario <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <textarea className="login-input" style={{ minHeight: 64, resize: 'vertical' }}
            placeholder="Cuéntanos lo que necesites…"
            value={note} onChange={e => setNote(e.target.value)} maxLength={300} />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? <><span className="spinner sm" /> Enviando…</> : 'Enviar solicitud'}
        </button>

        <div className="login-footer">
          <a href="/" style={{ color: 'var(--text2)', textDecoration: 'none' }}>← Acceso socios</a>
        </div>
      </form>
    </div>
  );
}
