export default function EmptyState({ icon = '📭', text = 'Sin datos', subtext }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{text}</div>
      {subtext && <div className="empty-state-text">{subtext}</div>}
    </div>
  );
}
