import { useEffect, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import LoadingScreen          from './pages/LoadingScreen';
import LoginScreen            from './pages/LoginScreen';
import ChangePasswordScreen   from './pages/ChangePasswordScreen';
import TopBar          from './components/TopBar';
import NavBar          from './components/NavBar';
import Toast           from './components/Toast';
import ProfileModal    from './components/modals/ProfileModal';
import CancelConfirmSheet from './components/modals/CancelConfirmSheet';
import BookingModal   from './components/modals/BookingModal';
import ScheduleScreen  from './pages/app/ScheduleScreen';
import MyBookingsScreen from './pages/app/MyBookingsScreen';
import AdminScreen     from './pages/app/admin/AdminScreen';

const PAGE_ORDER = ['schedule', 'mybookings', 'admin'];

export default function App() {
  const screen        = useAppStore(s => s.screen);
  const currentPage   = useAppStore(s => s.currentPage);
  const initAuth      = useAppStore(s => s.initAuth);
  const profileModal    = useAppStore(s => s.profileModal);
  const cancelConfirmId = useAppStore(s => s.cancelConfirmId);
  const bookingModal    = useAppStore(s => s.bookingModal);

  const prevPageRef = useRef(currentPage);
  const dirRef = useRef('');

  if (prevPageRef.current !== currentPage) {
    const prevIdx = PAGE_ORDER.indexOf(prevPageRef.current);
    const currIdx = PAGE_ORDER.indexOf(currentPage);
    dirRef.current = currIdx > prevIdx ? 'right' : 'left';
    prevPageRef.current = currentPage;
  }

  useEffect(() => { initAuth(); }, []);

  if (screen === 'loading')        return <LoadingScreen />;
  if (screen === 'login')          return <LoginScreen />;
  if (screen === 'changepassword') return <ChangePasswordScreen />;

  return (
    <div className="app-shell">
      <TopBar />

      <div className="page-transition-wrap" data-dir={dirRef.current} key={currentPage}>
        {currentPage === 'schedule'   && <ScheduleScreen />}
        {currentPage === 'mybookings' && <MyBookingsScreen />}
        {currentPage === 'admin'      && <AdminScreen />}
      </div>

      <NavBar />
      <Toast />
      {profileModal && <ProfileModal />}
      {cancelConfirmId && <CancelConfirmSheet />}
      {bookingModal && <BookingModal />}
    </div>
  );
}
