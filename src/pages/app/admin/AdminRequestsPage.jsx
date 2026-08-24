import { useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { formatDateFull } from '../../../utils';
import { REQUEST_SLOT_LABELS } from '../../../constants';

const STATUS_LABEL = { pending: 'Pendiente', confirmed: 'Confirmada', rejected: 'Rechazada' };

export default function AdminRequestsPage() {
  const adminRequests     = useAppStore(s => s.adminRequests);
  const adminLoading      = useAppStore(s => s.adminLoading);
  const loadAdminRequests = useAppStore(s => s.loadAdminRequests);
  const setStatus         = useAppStore(s => s.adminSetRequestStatus);
  const deleteRequest     = useAppStore(s => s.adminDeleteRequest);

  useEffect(() => { loadAdminRequests(); }, []);

  const pending = adminRequests.filter(r => r.status === 'pending').length;

  // Opens the admin's mail client with a ready-to-send confirmation
  function emailClient(r) {
    const fecha  = formatDateFull(r.date);
    const franja = REQUEST_SLOT_LABELS[r.slot] || r.slot;
    const subject = `Confirmación de tu sesión en Voilà — ${fecha}`;
    const body =
      `Hola ${r.name},\n\n` +
      `Tu sesión en Voilà queda confirmada:\n\n` +
      `Día: ${fecha}\n` +
      `Franja: ${franja}\n\n` +
      `Te esperamos. Si necesitas cambiar algo, responde a este correo.\n\n` +
      `Un saludo,\nVoilà Darkroom`;
    window.location.href =
      `mailto:${r.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function confirmAndEmail(r) {
    emailClient(r);          // open the pre-filled email first (user gesture)
    setStatus(r.id, 'confirmed');
  }

  return (
    <div className="admin-content">
      <div className="requests-head">
        <span className="requests-count">
          {adminRequests.length} solicitud{adminRequests.length !== 1 ? 'es' : ''}
          {pending > 0 && <span className="requests-pending"> · {pending} pendiente{pending > 1 ? 's' : ''}</span>}
        </span>
        <button className="link-btn" onClick={loadAdminRequests}>Actualizar</button>
      </div>

      {adminLoading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {!adminLoading && adminRequests.map(r => (
        <div key={r.id} className="request-card">
          <div className="request-card-top">
            <div className="request-card-name">{r.name}</div>
            <span className={`status-badge ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
          </div>

          <div className="request-card-when">
            {formatDateFull(r.date)} <span className="request-card-dot">·</span> {REQUEST_SLOT_LABELS[r.slot] || r.slot}
          </div>

          <div className="request-card-contact">
            <a href={`mailto:${r.email}`} className="request-link">{r.email}</a>
            {r.phone && <><span className="request-card-dot">·</span><a href={`tel:${r.phone}`} className="request-link muted">{r.phone}</a></>}
          </div>

          {r.note && <div className="request-card-note">{r.note}</div>}

          <div className="request-card-actions">
            {r.status !== 'confirmed' && (
              <button className="req-action confirm" onClick={() => confirmAndEmail(r)}>Confirmar y avisar</button>
            )}
            {r.status === 'confirmed' && (
              <button className="req-action" onClick={() => emailClient(r)}>Escribir email</button>
            )}
            {r.status !== 'rejected' && (
              <button className="req-action" onClick={() => setStatus(r.id, 'rejected')}>Rechazar</button>
            )}
            {r.status !== 'pending' && (
              <button className="req-action" onClick={() => setStatus(r.id, 'pending')}>Marcar pendiente</button>
            )}
            <button className="req-action danger" onClick={() => deleteRequest(r.id)}>Eliminar</button>
          </div>
        </div>
      ))}

      {!adminLoading && adminRequests.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">Sin solicitudes</div>
          <div className="empty-state-text">Las solicitudes de clientes puntuales aparecerán aquí.</div>
        </div>
      )}
    </div>
  );
}
