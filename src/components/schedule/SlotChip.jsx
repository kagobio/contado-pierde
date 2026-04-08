import { useAppStore } from '../../store/useAppStore';
import { getSlotStatus, getBookingAtSlot, getBlockAtSlot } from '../../utils';

export default function SlotChip({ slot, resourceId, date }) {
  const bookings  = useAppStore(s => s.bookings);
  const blocks    = useAppStore(s => s.blocks);
  const authUser  = useAppStore(s => s.authUser);
  const openModal = useAppStore(s => s.openBookingModal);

  const status = getSlotStatus(resourceId, date, slot, bookings, authUser?.uid, blocks);

  // For blocked slots, get the block label
  const block = status === 'blocked'
    ? getBlockAtSlot(resourceId, date, slot.startMinute, blocks)
    : null;

  // For "mine" / "occupied" slots, find the booking to show duration info
  const booking = (status === 'mine' || status === 'occupied')
    ? getBookingAtSlot(resourceId, date, slot.startMinute, slot.durationMin, bookings)
    : null;

  const isStart    = booking ? booking.startMinute === slot.startMinute : false;
  const isMidRange = booking && !isStart;

  const occupiedInitials = (status === 'occupied' && isStart && booking?.userName)
    ? booking.userName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)
    : null;

  const statusLabels = {
    available: 'libre',
    mine:      isStart ? 'mía' : '↑',
    occupied:  isStart ? (occupiedInitials || 'ocup.') : '↑',
    blocked:   '🔒',
    past:      '—',
  };

  function handleClick() {
    if (status === 'occupied' || status === 'past' || status === 'blocked') return;
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
      disabled={status === 'occupied' || status === 'past' || status === 'blocked'}
      title={status === 'blocked'
        ? `Bloqueado: ${block?.label || 'Taller'}`
        : `${slot.label} — ${statusLabels[status]}`
      }
    >
      <span className="slot-chip-time">{slot.label}</span>
      <span className="slot-chip-label">
        {status === 'blocked' ? (block?.label ? block.label.slice(0, 6) : '🔒') : statusLabels[status]}
      </span>
    </button>
  );
}
