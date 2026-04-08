import { useAppStore } from '../../store/useAppStore';
import { getSlotStatus, getBookingAtSlot } from '../../utils';

export default function SlotChip({ slot, resourceId, date }) {
  const bookings  = useAppStore(s => s.bookings);
  const authUser  = useAppStore(s => s.authUser);
  const openModal = useAppStore(s => s.openBookingModal);

  const status = getSlotStatus(resourceId, date, slot, bookings, authUser?.uid);

  // For "mine" slots, find the booking to show duration info
  const booking = (status === 'mine' || status === 'occupied')
    ? getBookingAtSlot(resourceId, date, slot.startMinute, slot.durationMin, bookings)
    : null;

  // Check if this slot is the START of a booking (vs mid-range)
  const isStart = booking ? booking.startMinute === slot.startMinute : false;
  const isMidRange = booking && !isStart;

  const occupiedName = (status === 'occupied' && isStart && booking?.userName)
    ? booking.userName
    : null;

  const statusLabels = {
    available: 'libre',
    mine:      isStart ? 'mía' : '↑',
    occupied:  isStart ? (occupiedName || 'ocupado') : '↑',
    past:      '—',
  };

  function handleClick() {
    if (status === 'occupied' || status === 'past') return;
    openModal({
      resourceId,
      date,
      startMinute: slot.startMinute,
      slotLabel:   slot.label,
      status,
    });
  }

  return (
    <button
      className={`slot-chip ${status} ${isMidRange ? 'mid-range' : ''}`}
      onClick={handleClick}
      disabled={status === 'occupied' || status === 'past'}
      title={`${slot.label} — ${statusLabels[status]}`}
    >
      <span className="slot-chip-time">{slot.label}</span>
      <span className="slot-chip-label">{statusLabels[status]}</span>
    </button>
  );
}
