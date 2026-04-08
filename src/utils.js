import { DAYS_SHORT, DAYS_FULL, MONTHS, MONTHS_SHORT } from './constants';

// ── Date helpers ───────────────────────────────────────────────────────────

export function todayStr() {
  return dateToStr(new Date());
}

export function dateToStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function strToDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Returns the Monday of the week containing the given date string
export function getWeekStart(dateStr) {
  const d = strToDate(dateStr);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  return dateToStr(d);
}

// Returns array of 7 date strings starting from Monday of the given week
export function getWeekDates(weekStartStr) {
  const start = strToDate(weekStartStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dateToStr(d);
  });
}

export function addWeeks(weekStartStr, n) {
  const d = strToDate(weekStartStr);
  d.setDate(d.getDate() + n * 7);
  return dateToStr(d);
}

// ── Format helpers ─────────────────────────────────────────────────────────

// "Miércoles, 9 abr"
export function formatDateFull(dateStr) {
  const d = strToDate(dateStr);
  return `${DAYS_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

// "9 abr"
export function formatDateShort(dateStr) {
  const d = strToDate(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

// "Mié 9"
export function formatDateChip(dateStr) {
  const d = strToDate(dateStr);
  return { day: DAYS_SHORT[d.getDay()], num: d.getDate() };
}

// "17:00 – 18:00"
export function formatSlotRange(startMinute, durationMin) {
  const endMinute = startMinute + durationMin;
  return `${minutesToTime(startMinute)} – ${minutesToTime(endMinute)}`;
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// "abril 2026"
export function formatMonthYear(weekStartStr) {
  const d = strToDate(weekStartStr);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Overlap detection ──────────────────────────────────────────────────────

// Returns true if two time ranges overlap
function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// Find the active booking that covers a given slot start time for a resource+date
export function getBookingAtSlot(resourceId, dateStr, slotStartMinute, slotDurationMin, bookings) {
  const slotEnd = slotStartMinute + slotDurationMin;
  return bookings.find(
    b => b.resourceId === resourceId &&
         b.date === dateStr &&
         b.status !== 'cancelled' &&
         rangesOverlap(b.startMinute, b.startMinute + b.durationMin, slotStartMinute, slotEnd)
  ) || null;
}

// ── Slot status ────────────────────────────────────────────────────────────

// Returns: 'available' | 'mine' | 'occupied' | 'past'
export function getSlotStatus(resourceId, dateStr, slot, bookings, userId) {
  const slotDate = strToDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (slotDate < today) return 'past';

  const booking = getBookingAtSlot(resourceId, dateStr, slot.startMinute, slot.durationMin, bookings);
  if (!booking) return 'available';
  if (booking.userId === userId) return 'mine';
  return 'occupied';
}

// ── Available durations for a booking starting at a slot ──────────────────
// Returns array of {durationMin, label, endLabel} that are:
//   - Within [minDurationMin, maxDurationMin]
//   - Don't overlap any existing booking
//   - Don't cross midnight
//   - End at or before the last slot end
export function getAvailableDurations(resourceId, dateStr, startMinute, slots, bookings, minDurationMin, maxDurationMin) {
  // Sort active slots by startMinute
  const sorted = [...slots].filter(s => s.active).sort((a, b) => a.startMinute - b.startMinute);

  // Find the first conflicting booking after startMinute
  const conflictingBookings = bookings.filter(
    b => b.resourceId === resourceId &&
         b.date === dateStr &&
         b.status !== 'cancelled' &&
         b.startMinute >= startMinute
  ).sort((a, b) => a.startMinute - b.startMinute);

  const hardLimit = conflictingBookings.length > 0
    ? conflictingBookings[0].startMinute
    : 24 * 60; // end of day

  // Build possible end points: each slot boundary after startMinute
  const endPoints = [];
  for (const slot of sorted) {
    const slotEnd = slot.startMinute + slot.durationMin;
    if (slotEnd <= startMinute) continue;
    if (slot.startMinute >= hardLimit) break; // blocked by another booking
    const duration = slotEnd - startMinute;
    if (duration > maxDurationMin) break;
    if (duration >= minDurationMin) {
      endPoints.push({
        durationMin: duration,
        label: formatDuration(duration),
        endLabel: minutesToTime(slotEnd),
      });
    }
  }

  return endPoints;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ── Booking ID ─────────────────────────────────────────────────────────────
// Composite ID: resourceId_date_startMinute
export function bookingDocId(resourceId, date, startMinute) {
  return `${resourceId}_${date}_${startMinute}`;
}

// ── Misc ───────────────────────────────────────────────────────────────────

export function formatRelativeDate(dateStr) {
  const today = todayStr();
  if (dateStr === today) return 'Hoy';
  const tomorrow = dateToStr(new Date(strToDate(today).setDate(strToDate(today).getDate() + 1)));
  if (dateStr === tomorrow) return 'Mañana';
  return formatDateFull(dateStr);
}
