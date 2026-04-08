import { useAppStore } from '../../store/useAppStore';
import ResourceCard from './ResourceCard';

export default function ResourceGrid({ date }) {
  const resources        = useAppStore(s => s.resources);
  const selectedCategory = useAppStore(s => s.selectedCategory);

  const filtered = resources.filter(r => {
    if (!r.active) return false;
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <div className="empty-state-text">No hay recursos en esta categoría</div>
      </div>
    );
  }

  return (
    <div className="resource-grid">
      {filtered.map(resource => (
        <ResourceCard key={resource.id} resource={resource} date={date} />
      ))}
    </div>
  );
}
