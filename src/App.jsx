import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import LoadingScreen   from './pages/LoadingScreen';
import LoginScreen     from './pages/LoginScreen';
import TopBar          from './components/TopBar';
import NavBar          from './components/NavBar';
import Toast           from './components/Toast';
import ScheduleScreen  from './pages/app/ScheduleScreen';
import MyBookingsScreen from './pages/app/MyBookingsScreen';
import AdminScreen     from './pages/app/admin/AdminScreen';

export default function App() {
  const screen      = useAppStore(s => s.screen);
  const currentPage = useAppStore(s => s.currentPage);
  const initAuth    = useAppStore(s => s.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  if (screen === 'loading') return <LoadingScreen />;
  if (screen === 'login')   return <LoginScreen />;

  return (
    <div className="app-shell">
      <TopBar />

      {currentPage === 'schedule'   && <ScheduleScreen />}
      {currentPage === 'mybookings' && <MyBookingsScreen />}
      {currentPage === 'admin'      && <AdminScreen />}

      <NavBar />
      <Toast />
    </div>
  );
}
