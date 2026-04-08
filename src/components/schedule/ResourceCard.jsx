import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_LABELS } from '../../constants';
import SlotChip from './SlotChip';
import ResourceIcon from '../shared/ResourceIcon';

export default function ResourceCard({ resource, date }) {
  const schedules = useAppStore(s => s.schedules);

  // Find schedule for this resource
  const schedule = schedules.find(s => s.id === resource.scheduleId)
    || schedules[0];
  const activeSlots = schedule?.slots?.filter(s => s.active) || [];

  return (
    <div className="resource-card">
      <div className="resource-card-header">
        <div
          className="resource-icon"
          style={{ background: categoryColor(resource.category) }}
        >
          <ResourceIcon icon={resource.icon} />
        </div>
        <div>
          <div className="resource-card-name">{resource.name}</div>
          <div className="resource-card-cat">{CATEGORY_LABELS[resource.category] || resource.category}</div>
        </div>
      </div>

      <div className="resource-slots">
        {activeSlots.length === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--muted)', padding: '0 4px 4px' }}>Sin franjas</span>
        ) : (
          activeSlots.map(slot => (
            <SlotChip
              key={slot.id}
              slot={slot}
              resourceId={resource.id}
              date={date}
            />
          ))
        )}
      </div>
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
