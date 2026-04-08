import { useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';

export default function AdminStatsPage() {
  const adminBookings     = useAppStore(s => s.adminBookings);
  const adminLoading      = useAppStore(s => s.adminLoading);
  const resources         = useAppStore(s => s.resources);
  const loadAdminBookings = useAppStore(s => s.loadAdminBookings);

  useEffect(() => {
    if (adminBookings.length === 0) loadAdminBookings();
  }, []);

  const confirmed = adminBookings.filter(b => b.status === 'confirmed');
  const cancelled = adminBookings.filter(b => b.status === 'cancelled');
  const cancelRate = adminBookings.length > 0
    ? Math.round((cancelled.length / adminBookings.length) * 100)
    : 0;

  // Per-resource count
  const resourceMap = Object.fromEntries(resources.map(r => [r.id, r]));
  const countByResource = confirmed.reduce((acc, b) => {
    acc[b.resourceId] = (acc[b.resourceId] || 0) + 1;
    return acc;
  }, {});

  const resourceStats = Object.entries(countByResource)
    .map(([id, count]) => ({ id, name: resourceMap[id]?.shortName || resourceMap[id]?.name || id, count }))
    .sort((a, b) => b.count - a.count);

  const maxCount = resourceStats[0]?.count || 1;

  // Per-user count
  const countByUser = confirmed.reduce((acc, b) => {
    acc[b.userName] = (acc[b.userName] || 0) + 1;
    return acc;
  }, {});
  const userStats = Object.entries(countByUser)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (adminLoading) {
    return <div className="admin-content" style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }

  return (
    <div className="admin-content">

      {/* Summary cards */}
      <div className="stats-summary">
        <div className="stats-card">
          <div className="stats-card-value">{confirmed.length}</div>
          <div className="stats-card-label">Confirmadas</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{cancelled.length}</div>
          <div className="stats-card-label">Canceladas</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{cancelRate}%</div>
          <div className="stats-card-label">Tasa cancel.</div>
        </div>
      </div>

      {/* Per-resource bar chart */}
      {resourceStats.length > 0 && (
        <>
          <div className="stats-section-title">Reservas por recurso</div>
          <div className="stats-bar-list">
            {resourceStats.map(({ id, name, count }) => (
              <div key={id} className="stats-bar-row">
                <div className="stats-bar-name">{name}</div>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <div className="stats-bar-count">{count}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Top users */}
      {userStats.length > 0 && (
        <>
          <div className="stats-section-title" style={{ marginTop: 24 }}>Top usuarios</div>
          <div className="stats-user-list">
            {userStats.map(({ name, count }, i) => (
              <div key={name} className="stats-user-row">
                <span className="stats-user-rank">#{i + 1}</span>
                <span className="stats-user-name">{name}</span>
                <span className="stats-user-count">{count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {adminBookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">Sin datos</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
            Carga reservas desde la pestaña Reservas primero
          </div>
        </div>
      )}
    </div>
  );
}
