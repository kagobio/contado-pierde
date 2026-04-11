import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatDateFull, formatSlotRange, todayStr } from '../../utils';
import ResourceIcon from '../../components/shared/ResourceIcon';

export default function MyBookingsScreen() {
  const myBookings         = useAppStore(s => s.myBookings);
  const resources          = useAppStore(s => s.resources);
  const requestCancel      = useAppStore(s => s.requestCancelBooking);
  const openModal          = useAppStore(s => s.openBookingModal);

  const today = todayStr();
  const active = myBookings
    .filter(b => b.date >= today && b.status !== 'cancelled')
    .sort((a, b) => a.date === b.date ? a.startMinute - b.startMinute : a.date.localeCompare(b.date));

  const resourceMap = Object.fromEntries(resources.map(r => [r.id, r]));

  if (active.length === 0) {
    return (
      <div className="mybookings-screen page-scroll">
        <div className="empty-state" style={{ marginTop: 60 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', marginBottom: 16 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div className="empty-state-text">Sin reservas próximas</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>
            Explora el horario y reserva tu próxima sesión
          </div>
        </div>
      </div>
    );
  }

  // Group by date
  const byDate = active.reduce((acc, b) => {
    (acc[b.date] = acc[b.date] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="mybookings-screen page-scroll">
      {Object.entries(byDate).map(([date, bookings]) => (
        <div key={date} className="mybookings-day-group">
          <div className="mybookings-day-label">
            {date === today ? '⚡ Hoy' : formatDateFull(date)}
          </div>
          {bookings.map(b => (
            <BookingItem
              key={b.id}
              booking={b}
              resource={resourceMap[b.resourceId]}
              onCancel={() => requestCancel(b.id)}
              onEdit={() => openModal({ resourceId: b.resourceId, date: b.date, startMinute: b.startMinute, status: 'mine' })}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function BookingItem({ booking, resource, onCancel, onEdit }) {
  const [removing, setRemoving] = useState(false);
  const timeRange = formatSlotRange(booking.startMinute, booking.durationMin);

  function handleCancel() {
    setRemoving(true);
    setTimeout(onCancel, 280);
  }

  return (
    <div className={`booking-item ${removing ? 'removing' : ''}`}>
      <div
        className="booking-item-icon"
        style={{ background: resource ? categoryColor(resource.category) : 'var(--bg3)' }}
      >
        <ResourceIcon icon={resource?.icon || 'camera'} size={20} />
      </div>

      <div className="booking-item-body">
        <div className="booking-item-name">{resource?.name || booking.resourceId}</div>
        <div className="booking-item-detail">{timeRange}</div>
        {booking.notes && (
          <div className="booking-item-notes">📝 {booking.notes}</div>
        )}
      </div>

      <div className="booking-item-actions">
        <button className="edit-btn" onClick={onEdit}>Editar</button>
        <button className="cancel-btn" onClick={handleCancel}>Cancelar</button>
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
