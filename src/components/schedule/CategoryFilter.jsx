import { useAppStore } from '../../store/useAppStore';
import { CATEGORIES } from '../../constants';

export default function CategoryFilter() {
  const selected = useAppStore(s => s.selectedCategory);
  const setSelectedCategory = useAppStore(s => s.setSelectedCategory);

  return (
    <div className="category-filter">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          className={`cat-pill ${selected === cat.id ? 'active' : ''}`}
          onClick={() => setSelectedCategory(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
