import { useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { formatDateFull } from '../../../utils';
import { REQUEST_SLOT_LABELS } from '../../../constants';

const STATUS_LABEL = { pending: 'Pendiente', confirmed: 'Confirmada', rejected: 'Rechazada' };

export default function AdminRequestsPage() {
  const adminRequests        = useAppStore(s => s.adminRequests);
  const adminLoading         = useAppStore(s => s.adminLoading);
  const loadAdminRequests    = useAppStore(s => s.loadAdminRequests);
  const setStatus            = useAppStore(s => s.adminSetRequestStatus);
  const deleteRequest        = useAppStore(s => s.adminDeleteRequest);

  useEffect(() => { loadAdminRequests(); }, []);

  const pending = adminRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="admin-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {adminRequests.length} solicitudes{pending > 0 && ` · ${pending} pendiente${pending > 1 ? 's' : ''}`}
        </span>
        <button onClick={loadAdminRequests} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          ↻ Actualizar
        </button>
      </div>

      {adminLoading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {!adminLoading && adminRequests.map(r => (
        <div key={r.id} className="admin-booking-row">
          <div className="admin-booking-main">
            <div className="admin-booking-name">{r.name}</div>
            <span className={`status-badge ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
          </div>

          <div className="admin-booking-meta">
            {formatDateFull(r.date)} · {REQUEST_SLOT_LABELS[r.slot] || r.slot}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>
            <div>✉️ <a href={`mailto:${r.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{r.email}</a></div>
            {r.phone && <div>📞 <a href={`tel:${r.phone}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{r.phone}</a></div>}
            {r.note && <div style={{ marginTop: 2 }}>📝 {r.note}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {r.status !== 'confirmed' && (
              <button
                onClick={() => setStatus(r.id, 'confirmed')}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', background: 'none', border: '1px solid rgba(52,199,89,0.4)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                ✓ Confirmar
              </button>
            )}
            {r.status !== 'rejected' && (
              <button
                onClick={() => setStatus(r.id, 'rejected')}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                ✕ Rechazar
              </button>
            )}
            {r.status !== 'pending' && (
              <button
                onClick={() => setStatus(r.id, 'pending')}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                ↩ Pendiente
              </button>
            )}
            <button
              onClick={() => deleteRequest(r.id)}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', background: 'none', border: '1px solid rgba(255,71,71,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', marginLeft: 'auto' }}>
              Eliminar
            </button>
          </div>
        </div>
      ))}

      {!adminLoading && adminRequests.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Sin solicitudes todavía</div>
        </div>
      )}
    </div>
  );
}
