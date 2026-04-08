import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import LoadingScreen          from './pages/LoadingScreen';
import LoginScreen            from './pages/LoginScreen';
import ChangePasswordScreen   from './pages/ChangePasswordScreen';
import TopBar          from './components/TopBar';
import NavBar          from './components/NavBar';
import Toast           from './components/Toast';
import ProfileModal    from './components/modals/ProfileModal';
import CancelConfirmSheet from './components/modals/CancelConfirmSheet';
import ScheduleScreen  from './pages/app/ScheduleScreen';
import MyBookingsScreen from './pages/app/MyBookingsScreen';
import AdminScreen     from './pages/app/admin/AdminScreen';

export default function App() {
  const screen        = useAppStore(s => s.screen);
  const currentPage   = useAppStore(s => s.currentPage);
  const initAuth      = useAppStore(s => s.initAuth);
  const profileModal    = useAppStore(s => s.profileModal);
  const cancelConfirmId = useAppStore(s => s.cancelConfirmId);

  useEffect(() => {
    initAuth();
  }, []);

  if (screen === 'loading')        return <LoadingScreen />;
  if (screen === 'login')          return <LoginScreen />;
  if (screen === 'changepassword') return <ChangePasswordScreen />;

  return (
    <div className="app-shell">
      <TopBar />

      {currentPage === 'schedule'   && <ScheduleScreen />}
      {currentPage === 'mybookings' && <MyBookingsScreen />}
      {currentPage === 'admin'      && <AdminScreen />}

      <NavBar />
      <Toast />
      {profileModal && <ProfileModal />}
      {cancelConfirmId && <CancelConfirmSheet />}
    </div>
  );
}
