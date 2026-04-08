import { useAppStore } from '../../store/useAppStore';
import { formatDateChip, formatMonthYear, todayStr } from '../../utils';

export default function WeekStrip() {
  const selectedDate = useAppStore(s => s.selectedDate);
  const weekDates    = useAppStore(s => s.weekDates);
  const weekStart    = useAppStore(s => s.weekStart);
  const myBookings   = useAppStore(s => s.myBookings);
  const setSelectedDate = useAppStore(s => s.setSelectedDate);
  const goNextWeek   = useAppStore(s => s.goNextWeek);
  const goPrevWeek   = useAppStore(s => s.goPrevWeek);

  const today = todayStr();

  // Dates that have at least one of the user's bookings
  const bookedDates = new Set(myBookings.map(b => b.date));

  return (
    <div className="week-strip-wrap">
      <div className="week-strip-header">
        <span className="week-strip-month">{formatMonthYear(weekStart)}</span>
        <div className="week-nav">
          <button className="week-nav-btn" onClick={goPrevWeek} aria-label="Semana anterior">‹</button>
          <button className="week-nav-today" onClick={() => setSelectedDate(today)}>HOY</button>
          <button className="week-nav-btn" onClick={goNextWeek} aria-label="Semana siguiente">›</button>
        </div>
      </div>

      <div className="week-days">
        {weekDates.map(dateStr => {
          const { day, num } = formatDateChip(dateStr);
          const isToday  = dateStr === today;
          const isActive = dateStr === selectedDate;
          const hasDot   = bookedDates.has(dateStr);
          return (
            <button
              key={dateStr}
              className={`week-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(dateStr)}
            >
              <span className="week-day-name">{day}</span>
              <span className="week-day-num">{num}</span>
              {hasDot && <span className="week-day-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
