import { useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import WeekStrip from '../../components/schedule/WeekStrip';
import CategoryFilter from '../../components/schedule/CategoryFilter';
import ResourceGrid from '../../components/schedule/ResourceGrid';
import { formatDateFull, todayStr, minutesToTime } from '../../utils';

const PTR_THRESHOLD = 64; // px needed to trigger refresh

export default function ScheduleScreen() {
  const selectedDate            = useAppStore(s => s.selectedDate);
  const appConfig               = useAppStore(s => s.appConfig);
  const myBookings              = useAppStore(s => s.myBookings);
  const subscribeBookingsForWeek = useAppStore(s => s.subscribeBookingsForWeek);
  const weekStart               = useAppStore(s => s.weekStart);

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

  // Pull-to-refresh
  const scrollRef  = useRef();
  const touchY     = useRef(0);
  const [pulling, setPulling] = useState(0);   // px pulled
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e) {
    if (scrollRef.current?.scrollTop === 0) {
      touchY.current = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    if (!touchY.current) return;
    const delta = e.touches[0].clientY - touchY.current;
    if (delta > 0 && scrollRef.current?.scrollTop === 0) {
      setPulling(Math.min(delta * 0.4, PTR_THRESHOLD + 16));
    }
  }

  async function onTouchEnd() {
    if (pulling >= PTR_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPulling(0);
      touchY.current = 0;
      await subscribeBookingsForWeek(weekStart);
      setTimeout(() => setRefreshing(false), 600);
    } else {
      setPulling(0);
      touchY.current = 0;
    }
  }

  return (
    <div
      className="page-scroll ptr-container"
      ref={scrollRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ paddingTop: pulling > 0 ? pulling : undefined }}
    >
      {/* Pull-to-refresh indicator */}
      {(pulling > 0 || refreshing) && (
        <div className="ptr-indicator" style={{ opacity: refreshing ? 1 : pulling / PTR_THRESHOLD }}>
          {refreshing
            ? <div className="spinner" style={{ width: 20, height: 20 }} />
            : <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: `rotate(${Math.min(pulling / PTR_THRESHOLD, 1) * 180}deg)`, transition: 'transform 0.1s' }}><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          }
        </div>
      )}

      {appConfig?.announcementText && (
        <div className="announcement-banner">{appConfig.announcementText}</div>
      )}

      {appConfig?.maintenanceMode && (
        <div className="maintenance-banner">
          🔧 El laboratorio está en mantenimiento. No se pueden realizar nuevas reservas.
        </div>
      )}

      {showReminder && (
        <div className="reminder-banner">
          <span className="reminder-banner-icon">🔔</span>
          <span>Tienes una reserva hoy a las {minutesToTime(upcomingToday.startMinute)}</span>
        </div>
      )}

      <WeekStrip />
      <CategoryFilter />

      <div className={`date-heading ${isToday ? 'today' : ''}`}>
        {dateLabel}
      </div>

      <ResourceGrid date={selectedDate} />

    </div>
  );
}
