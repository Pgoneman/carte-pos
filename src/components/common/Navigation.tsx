import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { usePosStore } from '../../stores/posStore';

const navItems = [
  { to: '/', label: '테이블' },
  { to: '/order', label: '주문' },
  { to: '/status', label: '현황' },
  { to: '/reservation', label: '예약' },
] as const;

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const showToast = usePosStore((s) => s.showToast);
  const pendingCount = usePosStore((s) =>
    s.kitchenOrders.filter((o) => o.status === 'pending' || o.status === 'cooking').length
  );

  const isOrderActive = location.pathname === '/order' || location.pathname.startsWith('/order/');

  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      showToast('테이블을 먼저 선택하세요');
      return;
    }
    navigate('/order');
  };

  return (
    <nav className="flex items-center gap-6 h-full">
      {navItems.map(({ to, label }) =>
        label === '주문' ? (
          <button
            key={to}
            type="button"
            onClick={handleOrderClick}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isOrderActive
                ? 'text-white border-white font-bold'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ) : label === '현황' ? (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-white border-white font-bold'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`
            }
          >
            {label}
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ) : (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-white border-white font-bold'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`
            }
          >
            {label}
          </NavLink>
        )
      )}
    </nav>
  );
}
