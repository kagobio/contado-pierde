import { useAppStore } from '../../store/useAppStore';

export default function CancelConfirmSheet() {
  const cancelConfirmId    = useAppStore(s => s.cancelConfirmId);
  const cancelBooking      = useAppStore(s => s.cancelBooking);
  const dismissCancelConfirm = useAppStore(s => s.dismissCancelConfirm);

  if (!cancelConfirmId) return null;

  return (
    <div className="modal-overlay" onClick={dismissCancelConfirm} style={{ zIndex: 70 }}>
      <div className="modal-sheet cancel-confirm-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ padding: '16px 20px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗑</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>¿Cancelar reserva?</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Esta acción no se puede deshacer.
          </div>
        </div>
        <div className="modal-footer" style={{ gap: 8 }}>
          <button
            className="btn-danger"
            onClick={() => cancelBooking(cancelConfirmId)}
          >
            Sí, cancelar reserva
          </button>
          <button className="btn-ghost" onClick={dismissCancelConfirm}>
            Mantener reserva
          </button>
        </div>
      </div>
    </div>
  );
}
