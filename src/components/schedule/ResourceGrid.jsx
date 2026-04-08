import { useAppStore } from '../../store/useAppStore';
import ResourceCard from './ResourceCard';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <div className="skeleton-box" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton-box" style={{ height: 13, width: '70%', borderRadius: 6 }} />
          <div className="skeleton-box" style={{ height: 10, width: '35%', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}

export default function ResourceGrid({ date }) {
  const resources        = useAppStore(s => s.resources);
  const selectedCategory = useAppStore(s => s.selectedCategory);

  // Show skeletons while loading
  if (resources.length === 0) {
    return (
      <div className="resource-grid">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const filtered = resources.filter(r => {
    if (!r.active) return false;
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', marginBottom: 12 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <div className="empty-state-text">Sin recursos en esta categoría</div>
      </div>
    );
  }

  return (
    <div className="resource-grid">
      {filtered.map((resource, i) => (
        <ResourceCard key={resource.id} resource={resource} date={date} index={i} />
      ))}
    </div>
  );
}
