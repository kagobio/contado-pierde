import { useAppStore } from '../../store/useAppStore';
import WeekStrip from '../../components/schedule/WeekStrip';
import CategoryFilter from '../../components/schedule/CategoryFilter';
import ResourceGrid from '../../components/schedule/ResourceGrid';
import BookingModal from '../../components/modals/BookingModal';
import { formatDateFull, todayStr } from '../../utils';

export default function ScheduleScreen() {
  const selectedDate   = useAppStore(s => s.selectedDate);
  const bookingModal   = useAppStore(s => s.bookingModal);
  const appConfig      = useAppStore(s => s.appConfig);
  const myBookings     = useAppStore(s => s.myBookings);

  const today = todayStr();

  // Upcoming reminder: next booking today within 2 hours
  const upcomingToday = myBookings
    .filter(b => b.date === today && b.status !== 'cancelled')
    .sort((a, b) => a.startMinute - b.startMinute)[0];

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const showReminder = upcomingToday &&
    upcomingToday.startMinute > nowMinutes &&
    upcomingToday.startMinute - nowMinutes <= 120;

  const isToday = selectedDate === today;
  const dateLabel = isToday ? 'Hoy' : formatDateFull(selectedDate);

  return (
    <div className="page-scroll">
      {appConfig?.announcementText && (
        <div className="announcement-banner">{appConfig.announcementText}</div>
      )}

      {showReminder && (
        <div className="reminder-banner">
          <span className="reminder-banner-icon">🔔</span>
          <span>
            Reserva hoy a las {upcomingToday.slotId?.replace('slot_', '') || '?'}
          </span>
        </div>
      )}

      <WeekStrip />
      <CategoryFilter />

      <div className={`date-heading ${isToday ? 'today' : ''}`}>
        {dateLabel}
      </div>

      <ResourceGrid date={selectedDate} />

      {bookingModal && <BookingModal />}
    </div>
  );
}
