import { useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { formatDateFull, formatSlotRange } from '../../../utils';

export default function AdminBookingsPage() {
  const adminBookings       = useAppStore(s => s.adminBookings);
  const adminLoading        = useAppStore(s => s.adminLoading);
  const adminBookingsFilter = useAppStore(s => s.adminBookingsFilter);
  const resources           = useAppStore(s => s.resources);
  const loadAdminBookings   = useAppStore(s => s.loadAdminBookings);
  const setFilter           = useAppStore(s => s.setAdminBookingsFilter);
  const adminCancelBooking  = useAppStore(s => s.adminCancelBooking);
  const exportCSV           = useAppStore(s => s.exportBookingsCSV);

  useEffect(() => { loadAdminBookings(); }, []);

  const resourceMap = Object.fromEntries(resources.map(r => [r.id, r.name]));

  return (
    <div className="admin-content">
      <div className="filter-bar">
        <input
          className="filter-input"
          type="date"
          value={adminBookingsFilter.dateFrom}
          onChange={e => setFilter({ dateFrom: e.target.value })}
          placeholder="Desde"
        />
        <input
          className="filter-input"
          type="date"
          value={adminBookingsFilter.dateTo}
          onChange={e => setFilter({ dateTo: e.target.value })}
          placeholder="Hasta"
        />
        <select
          className="filter-select"
          value={adminBookingsFilter.resourceId}
          onChange={e => setFilter({ resourceId: e.target.value })}
        >
          <option value="">Todos los recursos</option>
          {resources.map(r => <option key={r.id} value={r.id}>{r.shortName || r.name}</option>)}
        </select>
        <select
          className="filter-select"
          value={adminBookingsFilter.status}
          onChange={e => setFilter({ status: e.target.value })}
        >
          <option value="all">Todos los estados</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="pending">Pendientes</option>
        </select>
        <button className="btn-primary" style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13 }} onClick={loadAdminBookings}>
          Buscar
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{adminBookings.length} reservas</span>
        {adminBookings.length > 0 && (
          <button onClick={exportCSV} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            ↓ Exportar CSV
          </button>
        )}
      </div>

      {adminLoading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {!adminLoading && adminBookings.map(b => (
        <div key={b.id} className="admin-booking-row">
          <div className="admin-booking-main">
            <div className="admin-booking-name">{resourceMap[b.resourceId] || b.resourceId}</div>
            <span className={`status-badge ${b.status}`}>{b.status}</span>
          </div>
          <div className="admin-booking-meta">
            {formatDateFull(b.date)} · {formatSlotRange(b.startMinute, b.durationMin)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{b.userName}</div>
            {b.status !== 'cancelled' && (
              <button
                style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: '1px solid rgba(255,71,71,0.3)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
                onClick={() => adminCancelBooking(b.id)}
              >
                Cancelar
              </button>
            )}
          </div>
          {b.notes && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>📝 {b.notes}</div>}
        </div>
      ))}

      {!adminLoading && adminBookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">Sin resultados</div>
        </div>
      )}
    </div>
  );
}
