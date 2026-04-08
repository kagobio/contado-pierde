import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_LABELS } from '../../constants';
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
  const schedules = useAppStore(s => s.schedules);
  const [open, setOpen] = useState(false);

  const schedule = schedules.find(s => s.id === resource.scheduleId) || schedules[0];
  const activeSlots = schedule?.slots?.filter(s => s.active) || [];
  const accent = CATEGORY_ACCENT[resource.category] || '#888';

  function handleClick() {
    setOpen(o => !o);
    // Haptic feedback on mobile
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
        <span className={`resource-card-chevron ${open ? 'open' : ''}`}>›</span>
      </button>

      {open && (
        <div className="resource-slots">
          {activeSlots.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sin franjas</span>
          ) : (
            activeSlots.map(slot => (
              <SlotChip key={slot.id} slot={slot} resourceId={resource.id} date={date} />
            ))
          )}
        </div>
      )}
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
