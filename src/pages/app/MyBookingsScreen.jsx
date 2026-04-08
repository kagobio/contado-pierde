import { useAppStore } from '../../store/useAppStore';
import { formatDateFull, formatSlotRange, todayStr } from '../../utils';
import ResourceIcon from '../../components/shared/ResourceIcon';

export default function MyBookingsScreen() {
  const myBookings   = useAppStore(s => s.myBookings);
  const resources    = useAppStore(s => s.resources);
  const cancelBooking = useAppStore(s => s.cancelBooking);

  const today = todayStr();

  // Separate upcoming vs today
  const todayBookings    = myBookings.filter(b => b.date === today && b.status !== 'cancelled');
  const upcomingBookings = myBookings.filter(b => b.date > today && b.status !== 'cancelled');

  function getResource(resourceId) {
    return resources.find(r => r.id === resourceId);
  }

  if (myBookings.length === 0) {
    return (
      <div className="mybookings-screen page-scroll">
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No tienes reservas próximas</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Ve al horario para hacer una nueva reserva
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mybookings-screen page-scroll">
      {todayBookings.length > 0 && (
        <>
          <div className="mybookings-section-title">Hoy</div>
          {todayBookings.map(b => (
            <BookingItem
              key={b.id}
              booking={b}
              resource={getResource(b.resourceId)}
              onCancel={() => cancelBooking(b.id)}
              isToday
            />
          ))}
        </>
      )}

      {upcomingBookings.length > 0 && (
        <>
          <div className="mybookings-section-title">Próximas</div>
          {upcomingBookings.map(b => (
            <BookingItem
              key={b.id}
              booking={b}
              resource={getResource(b.resourceId)}
              onCancel={() => cancelBooking(b.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function BookingItem({ booking, resource, onCancel, isToday }) {
  const timeRange = formatSlotRange(booking.startMinute, booking.durationMin);

  return (
    <div className="booking-item">
      <div
        className="booking-item-icon"
        style={{ background: resource ? categoryColor(resource.category) : 'var(--bg3)' }}
      >
        <ResourceIcon icon={resource?.icon || 'camera'} size={20} />
      </div>

      <div className="booking-item-body">
        <div className="booking-item-name">{resource?.name || booking.resourceId}</div>
        <div className="booking-item-detail">{timeRange}</div>
        <div className="booking-item-date">
          {isToday ? '⚡ Hoy' : formatDateFull(booking.date)}
        </div>
        {booking.notes && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            📝 {booking.notes}
          </div>
        )}
      </div>

      <button className="cancel-btn" onClick={onCancel}>Cancelar</button>
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
