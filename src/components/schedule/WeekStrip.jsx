import { useAppStore } from '../../store/useAppStore';
import { formatDateChip, formatMonthYear, todayStr } from '../../utils';

export default function WeekStrip() {
  const selectedDate = useAppStore(s => s.selectedDate);
  const weekDates    = useAppStore(s => s.weekDates);
  const weekStart    = useAppStore(s => s.weekStart);
  const myBookings   = useAppStore(s => s.myBookings);
  const appConfig    = useAppStore(s => s.appConfig);
  const setSelectedDate = useAppStore(s => s.setSelectedDate);
  const goNextWeek   = useAppStore(s => s.goNextWeek);
  const goPrevWeek   = useAppStore(s => s.goPrevWeek);

  const today = todayStr();
  const maxAdvanceDays = appConfig?.maxAdvanceDays ?? 7;

  // Last bookable date
  const todayDate = new Date(today + 'T00:00:00');
  const maxDate = new Date(todayDate);
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
  const maxDateStr = maxDate.toISOString().slice(0, 10);

  // Dates that have at least one of the user's bookings
  const bookedDates = new Set(myBookings.map(b => b.date));

  // Hide next-week button if the entire next week is beyond the limit
  const nextWeekStart = new Date(weekStart + 'T00:00:00');
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextWeekStartStr = nextWeekStart.toISOString().slice(0, 10);
  const canGoNext = nextWeekStartStr <= maxDateStr;

  return (
    <div className="week-strip-wrap">
      <div className="week-strip-header">
        <span className="week-strip-month">{formatMonthYear(weekStart)}</span>
        <div className="week-nav">
          <button className="week-nav-btn" onClick={goPrevWeek} aria-label="Semana anterior">‹</button>
          <button className="week-nav-today" onClick={() => setSelectedDate(today)}>HOY</button>
          <button className="week-nav-btn" onClick={goNextWeek} aria-label="Semana siguiente" disabled={!canGoNext}
            style={!canGoNext ? { opacity: 0.25, cursor: 'default' } : {}}>›</button>
        </div>
      </div>

      <div className="week-days">
        {weekDates.map(dateStr => {
          const { day, num } = formatDateChip(dateStr);
          const isToday    = dateStr === today;
          const isActive   = dateStr === selectedDate;
          const hasDot     = bookedDates.has(dateStr);
          const isPast     = dateStr < today;
          const isBeyond   = dateStr > maxDateStr;
          const isDisabled = isPast || isBeyond;
          return (
            <button
              key={dateStr}
              className={`week-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''} ${isBeyond ? 'beyond-limit' : ''}`}
              onClick={() => !isDisabled && setSelectedDate(dateStr)}
              disabled={isDisabled}
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
