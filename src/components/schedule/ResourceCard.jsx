import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_LABELS } from '../../constants';
import { getSlotStatus } from '../../utils';
import SlotChip from './SlotChip';
import ResourceIcon from '../shared/ResourceIcon';

const CATEGORY_ACCENT = {
  enlarger_cabin: '#FF6B35',
  enlarger_post:  '#FFD100',
  large_format:   '#47C8FF',
  film_develop:   '#C847FF',
  scanner:        '#39D353',
  other:          '#888888',
};

export default function ResourceCard({ resource, date, index = 0 }) {
  const schedules  = useAppStore(s => s.schedules);
  const bookings   = useAppStore(s => s.bookings);
  const blocks     = useAppStore(s => s.blocks);
  const authUser   = useAppStore(s => s.authUser);
  const [open, setOpen] = useState(false);

  const schedule   = schedules.find(s => s.id === resource.scheduleId) || schedules[0];
  const activeSlots = schedule?.slots?.filter(s => s.active) || [];
  const accent      = CATEGORY_ACCENT[resource.category] || '#888';

  // Count free / occupied slots for this resource+date
  const slotStatuses  = activeSlots.map(slot =>
    getSlotStatus(resource.id, date, slot, bookings, authUser?.uid, blocks)
  );
  const freeCount     = slotStatuses.filter(s => s === 'available').length;
  const occupiedCount = slotStatuses.filter(s => s === 'occupied' || s === 'mine' || s === 'blocked').length;
  const total         = activeSlots.length;
  const occupancyPct  = total > 0 ? Math.round((occupiedCount / total) * 100) : 0;

  function handleClick() {
    setOpen(o => !o);
    if (navigator.vibrate) navigator.vibrate(8);
  }

  return (
    <div
      className="resource-card"
      style={{ '--card-accent': accent, animationDelay: `${index * 40}ms` }}
    >
      <button className="resource-card-header" onClick={handleClick}>
        <div className="resource-icon" style={{ background: `${accent}18` }}>
          <ResourceIcon icon={resource.icon} style={{ color: accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="resource-card-name">
            {open ? resource.name : (resource.shortName || resource.name)}
          </div>
          <div className="resource-card-cat">{CATEGORY_LABELS[resource.category] || resource.category}</div>
        </div>

        {/* Occupancy pill */}
        {total > 0 && !open && (
          <div className="occupancy-pill" style={{
            '--occ-color': freeCount === 0 ? 'var(--danger)' : freeCount <= 2 ? '#FFD100' : 'var(--success)',
          }}>
            <span className="occupancy-dot" />
            <span>{freeCount} libre{freeCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        <span className={`resource-card-chevron ${open ? 'open' : ''}`}>›</span>
      </button>

      {open && (
        <>
          {/* Occupancy bar */}
          {total > 0 && (
            <div className="occupancy-bar-wrap">
              <div className="occupancy-bar">
                <div className="occupancy-bar-fill" style={{ width: `${occupancyPct}%` }} />
              </div>
              <span className="occupancy-bar-label">{occupiedCount}/{total} ocupadas</span>
            </div>
          )}

          <div className="resource-slots">
            {activeSlots.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sin franjas</span>
            ) : (
              activeSlots.map(slot => (
                <SlotChip key={slot.id} slot={slot} resourceId={resource.id} date={date} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
