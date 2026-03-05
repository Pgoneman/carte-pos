import { useState, useMemo } from 'react';
import { usePosStore } from '../../stores/posStore';
import type { Menu } from '../../types';
import { useHasAycePass } from '../../hooks/useHasAycePass';
import { useOrderHistoryTotal } from './CustomerOrderHistory';
import CustomerMenuCard from './CustomerMenuCard';
import CustomerCartPanel from './CustomerCartPanel';
import TossPaymentModal from './TossPaymentModal';
import ModifierModal from './ModifierModal';
import OrderSuccessModal from './OrderSuccessModal';
import AyceCourseModal from './AyceCourseModal';

export default function CustomerOrderPanel() {
  const menus = usePosStore((s) => s.menus);
  const categories = usePosStore((s) => s.categories);
  const tables = usePosStore((s) => s.tables);
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const addToOrder = usePosStore((s) => s.addToOrder);
  const submitOrder = usePosStore((s) => s.submitOrder);
  const clearOrder = usePosStore((s) => s.clearOrder);
  const loading = usePosStore((s) => s.loading);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modifierMenu, setModifierMenu] = useState<Menu | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [sidebarTab, setSidebarTab] = useState<'cart' | 'orders'>('cart');
  const [showCourseModal, setShowCourseModal] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const processCustomerPayment = usePosStore((s) => s.processCustomerPayment);
  const currentOrder = usePosStore((s) => s.currentOrder);

  const { hasPass: hasAycePass, isLoading: ayceLoading } = useHasAycePass(historyRefreshKey);

  const allMenus = useMemo(() => Object.values(menus).flat(), [menus]);

  // Past orders total (AYCE-adjusted)
  const pastOrdersSubtotal = useOrderHistoryTotal(historyRefreshKey, hasAycePass);

  // Cart subtotal
  const cartSubtotal = useMemo(() => {
    return currentOrder.reduce((s, item) => {
      const menu = allMenus.find((m) => m.id === item.menuId);
      const effectivePrice = hasAycePass && menu?.isAyce ? 0 : item.price;
      return s + effectivePrice * item.quantity;
    }, 0);
  }, [currentOrder, allMenus, hasAycePass]);

  // Grand total (cart + past orders + tax)
  const grandSubtotal = cartSubtotal + pastOrdersSubtotal;
  const grandTax = +(grandSubtotal * 0.095).toFixed(2);
  const grandTotal = +(grandSubtotal + grandTax).toFixed(2);

  const tableName = tables.find((t) => t.id === selectedTableId)?.name ?? selectedTableId ?? '';

  const allCategories = useMemo(() => ['All', ...categories], [categories]);

  const displayMenus = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') {
      return Object.values(menus).flat();
    }
    return menus[selectedCategory] ?? [];
  }, [menus, selectedCategory]);

  const handleMenuClick = (menu: Menu) => {
    setModifierMenu(menu);
  };

  const handleAddFromModal = (metadata: Record<string, unknown>) => {
    if (!modifierMenu) return;
    addToOrder({
      menuId: modifierMenu.id,
      name: modifierMenu.name,
      price: modifierMenu.price,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
    setModifierMenu(null);
  };

  const handlePlaceOrder = async () => {
    const cartBefore = usePosStore.getState().currentOrder.length;
    await submitOrder();
    const cartAfter = usePosStore.getState().currentOrder.length;

    // submitOrder clears currentOrder on success only
    if (cartBefore > 0 && cartAfter === 0) {
      setHistoryRefreshKey((k) => k + 1);
      setShowSuccess(true);
    }
  };

  const handleNewOrder = () => {
    clearOrder();
    setShowSuccess(false);
    setSidebarTab('orders');
  };

  const handlePaymentComplete = async (method: string) => {
    const success = await processCustomerPayment(method);
    if (success) {
      setShowPayment(false);
      setPaymentComplete(true);
    } else {
      setShowPayment(false);
    }
  };

  // 결제 완료 감사 화면
  if (paymentComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream font-body">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <span className="text-4xl text-green-600">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">결제가 완료되었습니다</h1>
          <p className="text-gray-500">이용해 주셔서 감사합니다!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream font-body">
      {/* Header */}
      <header className="bg-brand-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <h1 className="font-display text-xl text-white">Carte AYCE</h1>
        </div>
        <div className="text-brand-brown-light text-sm">
          Table <span className="text-white font-semibold">#{tableName}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category bar */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100">
            {allCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (cat === 'All' && !selectedCategory) || cat === selectedCategory
                    ? 'bg-brand-red text-white'
                    : 'bg-brand-cream text-brand-warm hover:bg-brand-light'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayMenus.map((menu) => (
                <CustomerMenuCard
                  key={menu.id}
                  menu={menu}
                  hasAycePass={hasAycePass}
                  onClick={() => handleMenuClick(menu)}
                />
              ))}
            </div>

            {displayMenus.length === 0 && (
              <p className="text-center text-brand-muted mt-12">No items in this category.</p>
            )}
          </div>
        </div>

        {/* Cart sidebar */}
        <CustomerCartPanel
          onPlaceOrder={handlePlaceOrder}
          onPaymentClick={() => setShowPayment(true)}
          loading={loading}
          orderHistoryRefreshKey={historyRefreshKey}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          hasAycePass={hasAycePass}
        />
      </div>

      {/* Modifier modal */}
      {modifierMenu && (
        <ModifierModal
          menu={modifierMenu}
          hasAycePass={hasAycePass}
          onClose={() => setModifierMenu(null)}
          onAdd={handleAddFromModal}
        />
      )}

      {/* Success modal */}
      {showSuccess && <OrderSuccessModal onNewOrder={handleNewOrder} />}

      {/* Toss Payment modal */}
      {showPayment && (
        <TossPaymentModal
          totalAmount={grandTotal}
          tableName={tableName}
          onClose={() => setShowPayment(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* AYCE course selection modal — menus loaded + DB check done + no pass + not dismissed */}
      {showCourseModal && !hasAycePass && !ayceLoading && categories.length > 0 && (
        <AyceCourseModal onClose={() => setShowCourseModal(false)} />
      )}
    </div>
  );
}
