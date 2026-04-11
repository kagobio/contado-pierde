import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatDateFull, formatSlotRange, minutesToTime, getAvailableDurations } from '../../utils';
import { CATEGORY_LABELS } from '../../constants';
import ResourceIcon from '../shared/ResourceIcon';

export default function BookingModal() {
  const selectedSlot    = useAppStore(s => s.selectedSlot);
  const bookingMode     = useAppStore(s => s.bookingMode);
  const bookingNotes    = useAppStore(s => s.bookingNotes);
  const bookingLoading  = useAppStore(s => s.bookingLoading);
  const bookingSuccess  = useAppStore(s => s.bookingSuccess);
  const selectedDuration = useAppStore(s => s.selectedDuration);
  const resources       = useAppStore(s => s.resources);
  const schedules       = useAppStore(s => s.schedules);
  const bookings        = useAppStore(s => s.bookings);
  const closeModal      = useAppStore(s => s.closeBookingModal);
  const setNotes        = useAppStore(s => s.setBookingNotes);
  const setDuration     = useAppStore(s => s.setSelectedDuration);
  const confirmBooking  = useAppStore(s => s.confirmBooking);
  const cancelBooking   = useAppStore(s => s.cancelBooking);
  const updateBooking   = useAppStore(s => s.updateBooking);
  const setCurrentPage  = useAppStore(s => s.setCurrentPage);

  const [editing, setEditing] = useState(false);

  if (!selectedSlot) return null;

  const resource = resources.find(r => r.id === selectedSlot.resourceId);
  const schedule = schedules.find(s => s.id === resource?.scheduleId) || schedules[0];
  const activeSlots = schedule?.slots?.filter(s => s.active) || [];

  const minDuration = resource?.minDurationMin || 60;
  const maxDuration = resource?.maxDurationMin || 240;

  // Find existing booking for "mine" mode
  const myBookingDoc = bookingMode === 'view'
    ? bookings.find(b =>
        b.resourceId === selectedSlot.resourceId &&
        b.date === selectedSlot.date &&
        b.startMinute === selectedSlot.startMinute &&
        b.status !== 'cancelled'
      )
    : null;

  // When editing, exclude the current booking so it doesn't block itself
  const bookingsForDuration = editing && myBookingDoc
    ? bookings.filter(b => b.id !== myBookingDoc.id)
    : bookings;

  const availableDurations = getAvailableDurations(
    selectedSlot.resourceId,
    selectedSlot.date,
    selectedSlot.startMinute,
    activeSlots,
    bookingsForDuration,
    minDuration,
    maxDuration
  );

  // Auto-select first available duration on open (book mode) or current duration on edit
  useEffect(() => {
    if (bookingMode === 'book' && !selectedDuration && availableDurations.length > 0) {
      setDuration(availableDurations[0].durationMin);
    }
  }, [availableDurations.length, bookingMode]);

  // When entering edit mode, pre-select current booking duration
  useEffect(() => {
    if (editing && myBookingDoc) {
      setDuration(myBookingDoc.durationMin);
    }
  }, [editing]);

  // Reset editing on modal close
  useEffect(() => {
    if (!selectedSlot) setEditing(false);
  }, [selectedSlot]);

  const chosenDuration = selectedDuration || availableDurations[0]?.durationMin;
  const timeRange = chosenDuration
    ? `${minutesToTime(selectedSlot.startMinute)} – ${minutesToTime(selectedSlot.startMinute + chosenDuration)}`
    : minutesToTime(selectedSlot.startMinute);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }

  function handleCancelEdit() {
    setEditing(false);
    setDuration(null);
  }

  // ── Success view ───────────────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-sheet">
          <div className="modal-handle" />
          <div className="booking-success">
            <div className="booking-success-circle">
              <svg className="booking-success-check" viewBox="0 0 36 36">
                <polyline points="6,18 14,26 30,10" />
              </svg>
            </div>
            <div className="booking-success-title">¡Reserva confirmada!</div>
            <div className="booking-success-sub">
              {resource?.name}<br />
              {formatDateFull(selectedSlot.date)} · {timeRange}
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn-primary"
              onClick={() => { closeModal(); setCurrentPage('mybookings'); }}
            >
              Ver mis reservas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        {/* Resource header */}
        <div className="modal-header">
          <div className="modal-resource-icon" style={{ background: categoryColor(resource?.category) }}>
            <ResourceIcon icon={resource?.icon || 'camera'} size={22} />
          </div>
          <div>
            <div className="modal-resource-name">{resource?.name || 'Recurso'}</div>
            <div className="modal-resource-cat">{CATEGORY_LABELS[resource?.category] || ''}</div>
          </div>
        </div>

        <div className="modal-body">
          {/* Date */}
          <div className="modal-row">
            <span className="modal-row-icon">📅</span>
            <div className="modal-row-main">
              <div className="modal-row-label">Fecha</div>
              <div className="modal-row-value">{formatDateFull(selectedSlot.date)}</div>
            </div>
          </div>

          {/* Start time */}
          <div className="modal-row">
            <span className="modal-row-icon">⏰</span>
            <div className="modal-row-main">
              <div className="modal-row-label">Hora de inicio</div>
              <div className="modal-row-value">{minutesToTime(selectedSlot.startMinute)}</div>
            </div>
          </div>

          {/* Duration selector — book mode or edit mode */}
          {(bookingMode === 'book' || editing) && (
            <div>
              <div className="modal-notes-label" style={{ marginBottom: 8 }}>
                Duración
                <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                  (mín {resource?.minDurationMin / 60}h – máx {resource?.maxDurationMin / 60}h)
                </span>
              </div>

              {availableDurations.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--danger)', padding: '10px 0' }}>
                  No hay tiempo suficiente disponible desde esta hora para cumplir el mínimo de {minDuration / 60}h.
                </div>
              ) : (
                <div className="duration-picker">
                  {availableDurations.map(d => (
                    <button
                      key={d.durationMin}
                      className={`duration-chip ${chosenDuration === d.durationMin ? 'active' : ''}`}
                      onClick={() => setDuration(d.durationMin)}
                    >
                      <span className="duration-chip-main">{d.label}</span>
                      <span className="duration-chip-end">hasta {d.endLabel}</span>
                    </button>
                  ))}
                </div>
              )}

              {chosenDuration && (
                <div className="booking-range-summary">
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {editing ? 'Nueva franja' : 'Reservarás'}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--slot-available)' }}> {timeRange}</span>
                </div>
              )}
            </div>
          )}

          {/* View mode: show existing booking info */}
          {bookingMode === 'view' && !editing && myBookingDoc && (
            <>
              <div className="modal-row">
                <span className="modal-row-icon">⏱</span>
                <div className="modal-row-main">
                  <div className="modal-row-label">Duración reservada</div>
                  <div className="modal-row-value">
                    {minutesToTime(myBookingDoc.startMinute)} – {minutesToTime(myBookingDoc.startMinute + myBookingDoc.durationMin)}
                    <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 8 }}>
                      ({myBookingDoc.durationMin / 60}h)
                    </span>
                  </div>
                </div>
              </div>
              {myBookingDoc.notes && (
                <div className="modal-row">
                  <span className="modal-row-icon">📝</span>
                  <div className="modal-row-main">
                    <div className="modal-row-label">Notas</div>
                    <div className="modal-row-value" style={{ fontSize: 14, fontWeight: 500 }}>{myBookingDoc.notes}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Notes — book mode only */}
          {bookingMode === 'book' && (
            <div>
              <div className="modal-notes-label">Notas (opcional)</div>
              <textarea
                className="modal-notes-input"
                placeholder="Ej: traigo papel RC, necesito…"
                value={bookingNotes}
                onChange={e => setNotes(e.target.value)}
                maxLength={200}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {bookingMode === 'book' ? (
            <>
              <button
                className="btn-primary"
                onClick={confirmBooking}
                disabled={bookingLoading || !chosenDuration || availableDurations.length === 0}
              >
                {bookingLoading ? <><span className="spinner sm" /> Guardando…</> : '✓ Reservar'}
              </button>
              <button className="btn-ghost" onClick={closeModal}>cancelar</button>
            </>
          ) : editing ? (
            <>
              <button
                className="btn-primary"
                onClick={() => { if (myBookingDoc && chosenDuration) updateBooking(myBookingDoc.id, chosenDuration); }}
                disabled={!chosenDuration || availableDurations.length === 0}
              >
                Guardar cambios
              </button>
              <button className="btn-ghost" onClick={handleCancelEdit}>volver</button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', color: 'var(--slot-mine)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                Esta franja es tuya
              </div>
              <button
                className="btn-primary"
                onClick={() => setEditing(true)}
              >
                Editar duración
              </button>
              <button
                className="btn-danger-ghost"
                onClick={() => { if (myBookingDoc) { cancelBooking(myBookingDoc.id); closeModal(); } }}
              >
                Cancelar reserva
              </button>
              <button className="btn-ghost" onClick={closeModal}>cerrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function categoryColor(category) {
  const colors = {
    enlarger_cabin: 'rgba(255,107,53,0.15)',
    enlarger_post:  'rgba(255,199,71,0.15)',
    large_format:   'rgba(71,200,255,0.15)',
    film_develop:   'rgba(200,71,255,0.15)',
    scanner:        'rgba(57,211,83,0.15)',
    other:          'rgba(255,255,255,0.08)',
  };
  return colors[category] || colors.other;
}
