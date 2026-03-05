import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import Toast from './components/common/Toast';
import { PageTransition } from './components/common/PageTransition';
import ManagementDashboard from './components/settings/ManagementDashboard';
import TablePage from './pages/TablePage';
import OrderPage from './pages/OrderPage';
import StatusPage from './pages/StatusPage';
import TakeoutPage from './pages/TakeoutPage';
import ReservationPage from './pages/ReservationPage';
import SettingsPage from './pages/SettingsPage';
import CustomerOrderPage from './pages/CustomerOrderPage';
import DebugOverlay from './components/common/DebugOverlay';
import { usePosStore } from './stores/posStore';

function PosLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [forceSettingsClosed, setForceSettingsClosed] = useState(false);
  const location = useLocation();
  const fetchKitchenOrders = usePosStore((s) => s.fetchKitchenOrders);
  const startRealtimeSync = usePosStore((s) => s.startRealtimeSync);
  const stopRealtimeSync = usePosStore((s) => s.stopRealtimeSync);
  const isSettingsRoute = location.pathname === '/settings';

  useEffect(() => {
    setForceSettingsClosed(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchKitchenOrders();
  }, [fetchKitchenOrders]);

  useEffect(() => {
    startRealtimeSync();
    return () => stopRealtimeSync();
  }, [startRealtimeSync, stopRealtimeSync]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Toast />
      <main className="flex-1 overflow-auto">
        <PageTransition>
          <Routes>
            <Route path="/" element={<TablePage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order/:tableId" element={<OrderPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/takeout" element={<TakeoutPage />} />
            <Route path="/reservation" element={<ReservationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </PageTransition>
      </main>

      <ManagementDashboard
        isOpen={!forceSettingsClosed && (isSidebarOpen || isSettingsRoute)}
        onClose={() => {
          setIsSidebarOpen(false);
          setForceSettingsClosed(true);
        }}
      />
    </div>
  );
}

function App() {
  const location = useLocation();
  const isCustomerRoute = location.pathname.startsWith('/customer');

  return (
    <ErrorBoundary>
      {isCustomerRoute ? (
        <Routes>
          <Route path="/customer/:tableId" element={<CustomerOrderPage />} />
        </Routes>
      ) : (
        <PosLayout />
      )}
      <DebugOverlay />
    </ErrorBoundary>
  );
}

export default App;
