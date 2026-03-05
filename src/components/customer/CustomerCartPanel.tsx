import { useMemo } from 'react';
import { usePosStore } from '../../stores/posStore';
import type { Menu, OrderItem } from '../../types';
import CustomerOrderHistory, { useOrderHistoryTotal } from './CustomerOrderHistory';

const COMBOS = [
  { id: 'c1', label: '🔥 BBQ Classic', tag: 'Most Ordered', itemNames: ['삼겹살', '목살', '소주', '콜라'] },
  { id: 'c2', label: '🌊 Surf & Turf', tag: "Chef's Pick", itemNames: ['갈비살', '새우구이', '된장찌개', '막걸리'] },
  { id: 'c3', label: '🥗 Light Set', tag: 'Low Cal', itemNames: ['오징어구이', '냉면', '콜라'] },
  { id: 'c4', label: '👑 Premium Night', tag: 'VIP', itemNames: ['소갈비', '항정살', '새우구이', '소맥세트'] },
];

type SidebarTab = 'cart' | 'orders';

interface CustomerCartPanelProps {
  onPlaceOrder: () => void;
  onPaymentClick: () => void;
  loading: boolean;
  orderHistoryRefreshKey: number;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  hasAycePass: boolean;
}

export default function CustomerCartPanel({ onPlaceOrder, onPaymentClick, loading, orderHistoryRefreshKey, activeTab, onTabChange, hasAycePass }: CustomerCartPanelProps) {
  const currentOrder = usePosStore((s) => s.currentOrder);
  const menus = usePosStore((s) => s.menus);
  const addToOrder = usePosStore((s) => s.addToOrder);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const removeFromOrder = usePosStore((s) => s.removeFromOrder);

  const allMenus = useMemo(() => Object.values(menus).flat(), [menus]);

  const findMenu = (name: string): Menu | undefined =>
    allMenus.find((m) => m.name === name);

  const findMenuById = (id: string): Menu | undefined =>
    allMenus.find((m) => m.id === id);

  const handleAddCombo = (itemNames: string[]) => {
    itemNames.forEach((name) => {
      const menu = findMenu(name);
      if (menu) {
        addToOrder({ menuId: menu.id, name: menu.name, price: menu.price });
      }
    });
  };

  // Current cart total
  const { cartSubtotal } = useMemo(() => {
    const sub = currentOrder.reduce((s, item) => {
      const menu = findMenuById(item.menuId);
      const effectivePrice = hasAycePass && menu?.isAyce ? 0 : item.price;
      return s + effectivePrice * item.quantity;
    }, 0);
    const t = +(sub * 0.095).toFixed(2);
    return { cartSubtotal: sub, cartTax: t, cartTotal: +(sub + t).toFixed(2) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder, allMenus, hasAycePass]);

  // Past orders total (AYCE-adjusted)
  const pastOrdersSubtotal = useOrderHistoryTotal(orderHistoryRefreshKey, hasAycePass);

  // Grand total
  const grandSubtotal = cartSubtotal + pastOrdersSubtotal;
  const grandTax = +(grandSubtotal * 0.095).toFixed(2);
  const grandTotal = +(grandSubtotal + grandTax).toFixed(2);

  const formatPrice = (won: number) => `$${(won / 1000).toFixed(0)}`;

  const donenessLabel = (meta?: Record<string, unknown>) => {
    if (!meta?.doneness) return null;
    const d = String(meta.doneness);
    if (d === 'Rare') return 'R';
    if (d === 'Medium') return 'Med';
    if (d === 'Well-done') return 'WD';
    return d;
  };

  return (
    <div className="w-80 flex flex-col bg-white border-l border-gray-100 h-full">
      {/* Quick Combos */}
      <div className="bg-brand-brown p-4">
        <h3 className="text-white font-display text-sm mb-3">Quick Combos</h3>
        <div className="space-y-2">
          {COMBOS.map((combo) => (
            <div
              key={combo.id}
              className="flex items-center justify-between bg-brand-warm/40 rounded-lg px-3 py-2"
            >
              <div>
                <p className="text-white text-xs font-medium">{combo.label}</p>
                <p className="text-brand-brown-light text-[10px]">{combo.tag}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAddCombo(combo.itemNames)}
                className="text-[10px] font-bold text-brand-red bg-white rounded-full px-3 py-1 hover:bg-brand-light transition-colors"
              >
                Add All
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => onTabChange('cart')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative ${
            activeTab === 'cart'
              ? 'text-brand-red'
              : 'text-brand-muted hover:text-brand-warm'
          }`}
        >
          Cart
          {currentOrder.length > 0 && (
            <span className="ml-1 bg-brand-red text-white text-[9px] px-1.5 py-0.5 rounded-full">
              {currentOrder.length}
            </span>
          )}
          {activeTab === 'cart' && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-red rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('orders')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative ${
            activeTab === 'orders'
              ? 'text-brand-red'
              : 'text-brand-muted hover:text-brand-warm'
          }`}
        >
          My Orders
          {activeTab === 'orders' && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-red rounded-full" />
          )}
        </button>
      </div>

      {/* Tab content — both always mounted, toggle visibility */}
      <div className="flex-1 overflow-y-auto relative">
        <div className={`p-4 ${activeTab === 'cart' ? '' : 'hidden'}`}>
          <h3 className="text-brand-dark font-semibold text-sm mb-3">
            New Items ({currentOrder.length})
          </h3>

          {currentOrder.length === 0 ? (
            <p className="text-brand-muted text-xs text-center py-8">
              Your cart is empty. Add items from the menu!
            </p>
          ) : (
            <div className="space-y-3">
              {currentOrder.map((item: OrderItem, idx: number) => {
                const menu = findMenuById(item.menuId);
                const isAyce = hasAycePass && (menu?.isAyce ?? false);
                const badge = donenessLabel(item.metadata);

                return (
                  <div key={`${item.menuId}-${idx}`} className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{menu?.img || '🍽️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-dark truncate">
                        {item.name}
                        {badge && (
                          <span className="ml-1 text-[9px] bg-brand-cream text-brand-warm px-1.5 py-0.5 rounded-full">
                            {badge}
                          </span>
                        )}
                      </p>
                      {item.metadata?.notes != null && (
                        <p className="text-[10px] text-brand-red/80 mt-0.5 leading-tight">
                          {String(item.metadata.notes)}
                        </p>
                      )}
                      <p className="text-[10px] text-brand-muted">
                        {isAyce ? 'Included' : formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity <= 1) removeFromOrder(item.menuId);
                          else updateQuantity(item.menuId, item.quantity - 1);
                        }}
                        className="w-6 h-6 rounded-full bg-brand-cream text-brand-warm text-xs font-bold hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-brand-cream text-brand-warm text-xs font-bold hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`p-4 ${activeTab === 'orders' ? '' : 'hidden'}`}>
          <CustomerOrderHistory refreshKey={orderHistoryRefreshKey} hasAycePass={hasAycePass} />
        </div>
      </div>

      {/* Summary + Place Order */}
      <div className="border-t border-gray-100 p-4 space-y-2">
        {/* Current cart total (only when cart has items) */}
        {currentOrder.length > 0 && (
          <div className="flex justify-between text-xs text-brand-muted">
            <span>This order</span>
            <span>{formatPrice(cartSubtotal)}</span>
          </div>
        )}

        {/* Past orders total (only when there are past orders) */}
        {pastOrdersSubtotal > 0 && (
          <div className="flex justify-between text-xs text-brand-muted">
            <span>Previous orders</span>
            <span>{formatPrice(pastOrdersSubtotal)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs text-brand-muted">
          <span>Tax (9.5%)</span>
          <span>{formatPrice(grandTax)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-brand-dark pt-1 border-t border-gray-100">
          <span>Total Due</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={currentOrder.length === 0 || loading}
          className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-brand-red-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
        {grandTotal > 0 && (
          <button
            type="button"
            onClick={onPaymentClick}
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#0064FF' }}
          >
            즉시 결제 ({formatPrice(grandTotal)})
          </button>
        )}
      </div>
    </div>
  );
}
