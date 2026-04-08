export default function EmptyState({ icon = '📭', text = 'Sin datos', subtext }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-text">{text}</div>
      {subtext && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtext}</div>}
    </div>
  );
}
