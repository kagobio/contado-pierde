import { useAppStore } from '../../../store/useAppStore';
import AdminResourcesPage from './AdminResourcesPage';
import AdminSchedulePage  from './AdminSchedulePage';
import AdminBookingsPage  from './AdminBookingsPage';
import AdminUsersPage     from './AdminUsersPage';
import AdminConfigPage    from './AdminConfigPage';
import AdminStatsPage     from './AdminStatsPage';

const ADMIN_TABS = [
  { id: 'resources', label: 'Recursos' },
  { id: 'schedules', label: 'Horarios' },
  { id: 'bookings',  label: 'Reservas' },
  { id: 'stats',     label: 'Stats' },
  { id: 'users',     label: 'Usuarios' },
  { id: 'config',    label: 'Config' },
];

export default function AdminScreen() {
  const userDoc    = useAppStore(s => s.userDoc);
  const adminPage  = useAppStore(s => s.adminPage);
  const setAdminPage = useAppStore(s => s.setAdminPage);

  // Guard: only admins
  if (userDoc?.role !== 'admin') {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon">🔒</div>
        <div className="empty-state-text">Solo accesible para administradores</div>
      </div>
    );
  }

  return (
    <div className="admin-shell page-scroll">
      <nav className="admin-tabnav">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${adminPage === tab.id ? 'active' : ''}`}
            onClick={() => setAdminPage(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {adminPage === 'resources' && <AdminResourcesPage />}
      {adminPage === 'schedules' && <AdminSchedulePage />}
      {adminPage === 'bookings'  && <AdminBookingsPage />}
      {adminPage === 'stats'     && <AdminStatsPage />}
      {adminPage === 'users'     && <AdminUsersPage />}
      {adminPage === 'config'    && <AdminConfigPage />}
    </div>
  );
}
