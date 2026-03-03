import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../../stores/posStore';
import type { OrderItem } from '../../stores/posStore';

/**
 * POS System UI - Supabase + posStore
 * fetchMenus(), categories/menus from store, 주문 → submitOrder, 결제 → processPayment
 */

const CategoryTabs = ({
  categories,
  activeId,
  onSelect,
}: {
  categories: string[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) => {
  if (categories.length === 0) return null;
  return (
    <div className="bg-gray-300 border-b border-gray-400 flex items-center justify-between px-2 h-12 shrink-0">
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide flex-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            type="button"
            className={`px-3 py-1.5 text-sm font-bold rounded-full whitespace-nowrap transition-all ${activeId === cat
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-2 text-gray-500 shrink-0">
        <span className="cursor-pointer opacity-30">◀</span>
        <span className="cursor-pointer">▶</span>
        <span className="cursor-pointer">🔍</span>
      </div>
    </div>
  );
};

function OrderItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: OrderItem;
  onUpdate: (menuId: string, quantity: number) => void;
  onRemove: (menuId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.name}</div>
        <div className="text-blue-600 text-sm">
          {(item.price * item.quantity).toLocaleString()}원
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onUpdate(item.menuId, item.quantity - 1)}
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 text-gray-700 font-bold"
          aria-label="수량 감소"
        >
          −
        </button>
        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdate(item.menuId, item.quantity + 1)}
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 text-gray-700 font-bold"
          aria-label="수량 증가"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.menuId)}
          className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function Sidebar({
  currentOrder,
  removeFromOrder,
  updateQuantity,
  submitOrder,
  onPaymentClick,
  selectedTableId,
  loading,
}: {
  currentOrder: OrderItem[];
  removeFromOrder: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  submitOrder: () => void;
  onPaymentClick: () => void;
  selectedTableId: string | null;
  loading: boolean;
}) {
  const total = currentOrder.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return (
    <div className="w-72 lg:w-80 flex-shrink-0 bg-white flex flex-col border-l border-gray-300 h-full relative">
      <div className="p-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex gap-1">
          <button className="px-2 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50" type="button">
            포장
          </button>
          <button className="px-2 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50" type="button">
            배달
          </button>
          <button className="px-2 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50" type="button">
            대기
          </button>
        </div>
        <div className="flex gap-3 text-gray-400">
          <span className="cursor-pointer hover:text-gray-600">🖨️</span>
          <span className="cursor-pointer hover:text-gray-600">🗑️</span>
          <span className="cursor-pointer hover:text-gray-600">🔖</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {currentOrder.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-300">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-sm">주문 내역이 없습니다</div>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {currentOrder.map((i) => (
              <li key={i.menuId}>
                <OrderItemRow
                  item={i}
                  onUpdate={updateQuantity}
                  onRemove={removeFromOrder}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {currentOrder.length > 0 && (
        <div className="px-2 py-1 border-t border-gray-200 text-sm font-bold text-gray-700">
          합계: {total.toLocaleString()}원
        </div>
      )}

      <div className="p-2 grid grid-cols-2 gap-2">
        <button className="bg-blue-50 text-blue-500 py-3 rounded-md font-bold text-sm" type="button">
          할인
        </button>
        <button className="bg-gray-100 text-gray-400 py-3 rounded-md font-bold text-sm" type="button">
          분할
        </button>
        <button
          className="bg-blue-400 text-white py-5 rounded-md font-bold text-xl col-span-1 shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          onClick={submitOrder}
          disabled={currentOrder.length === 0 || loading}
        >
          {loading ? '주문 중...' : '주문'}
        </button>
        <button
          className="bg-gray-300 text-white py-5 rounded-md font-bold text-xl col-span-1 shadow-sm hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          onClick={onPaymentClick}
          disabled={!selectedTableId}
        >
          결제
        </button>
      </div>

      <div className="absolute -bottom-2 -left-16 w-20 h-20 z-10 pointer-events-none text-5xl">
        🐥
      </div>
    </div>
  );
}

const Footer = () => {
  return (
    <div className="p-3 bg-gray-200 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-500 font-bold">
          <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
            ✏️ 편집모드
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
            ➕ 상품추가
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <span className="cursor-pointer">◀</span>
          <span className="text-xs">1 / 1</span>
          <span className="cursor-pointer">▶</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-gray-600">즐겨찾는 옵션 (1/2)</div>
        <div className="flex gap-2 items-end">
          <div className="flex gap-2 flex-1">
            <button
              className="flex-1 bg-white border border-gray-200 rounded-md py-3 shadow-sm flex flex-col items-center justify-center hover:bg-gray-50"
              type="button"
            >
              <span className="text-sm font-bold text-gray-700">특</span>
              <span className="text-xs text-gray-400">(1,000)</span>
            </button>
            <button
              className="flex-1 bg-white border border-gray-200 rounded-md py-3 shadow-sm flex items-center justify-center hover:bg-gray-50"
              type="button"
            >
              <span className="text-sm font-bold text-gray-700">비빔</span>
            </button>
          </div>
          <div className="flex flex-col gap-1 w-20">
            <button
              className="bg-gray-400 text-white py-1.5 rounded-md text-xs font-bold"
              type="button"
            >
              메모
            </button>
            <div className="flex bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
              <button
                className="flex-1 py-1.5 text-gray-400 hover:bg-gray-50 border-r border-gray-100"
                type="button"
              >
                ◀
              </button>
              <button
                className="flex-1 py-1.5 text-gray-400 hover:bg-gray-50"
                type="button"
              >
                ▶
              </button>
            </div>
            <button
              className="bg-gray-400 text-white py-1.5 rounded-md text-xs font-bold"
              type="button"
            >
              옵션
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  tableName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  tableName: string;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl w-96 p-6 shadow-xl text-gray-900">
        <h3 className="text-lg font-bold mb-4">결제</h3>
        <p className="text-sm text-gray-600 mb-1">테이블: {tableName}</p>
        <p className="text-2xl font-bold mb-6">총액: {totalAmount.toLocaleString()}원</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
          >
            결제 완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPanel() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const {
    tables,
    selectedTableId,
    selectedCategory,
    categories,
    menus,
    currentOrder,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    submitOrder,
    selectCategory,
    fetchMenus,
    fetchTables,
    fetchTableOrders,
    processPayment,
    showToast,
  } = usePosStore();

  useEffect(() => {
    if (!selectedTableId) {
      navigate('/');
      return;
    }
    fetchTables();
    fetchMenus();
    fetchTableOrders(selectedTableId);
  }, [selectedTableId, navigate, fetchTables, fetchMenus, fetchTableOrders]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;
  const totalAmount = selectedTable?.totalAmount ?? 0;
  const menuList = (menus[selectedCategory || ''] || []) as { id: string; name: string; category_name?: string; price: number }[];

  const handleSubmitOrder = async () => {
    if (currentOrder.length === 0) {
      showToast('주문할 메뉴를 선택하세요');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitOrder();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentClick = () => {
    if (!selectedTableId) return;
    setPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedTableId) return;
    await processPayment('card');
    showToast('결제가 완료되었습니다');
    setPaymentModalOpen(false);
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-300 font-sans overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 상단: 선택된 테이블 정보 */}
          <div className="bg-gray-100 p-4 mb-0 rounded-none border-b border-gray-300 shrink-0">
            <span className="font-bold text-lg">
              {selectedTable?.name} - {selectedTable?.guests ?? 0}명
            </span>
            <span className="ml-4 text-gray-600">
              {(selectedTable?.totalAmount ?? 0).toLocaleString()}원
            </span>
          </div>

          <CategoryTabs
            categories={categories}
            activeId={selectedCategory}
            onSelect={selectCategory}
          />

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {menuList.length === 0 ? (
                <div className="col-span-full flex items-center justify-center py-12 text-gray-500">
                  메뉴가 없습니다. 설정에서 엑셀을 업로드하세요.
                </div>
              ) : (
                menuList.map((menu) => (
                  <div
                    key={String(menu.id)}
                    onClick={() =>
                      addToOrder({
                        menuId: String(menu.id),
                        name: menu.name,
                        price: menu.price,
                      })
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      addToOrder({ menuId: String(menu.id), name: menu.name, price: menu.price })
                    }
                    className="p-3 bg-white border rounded-lg cursor-pointer hover:shadow-md hover:border-blue-400 transition text-left"
                  >
                    <div className="text-sm font-medium line-clamp-2">{menu.name}</div>
                    <div className="text-blue-600 font-bold text-sm mt-1">
                      {menu.price.toLocaleString()}원
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Footer />
        </main>

        <Sidebar
          currentOrder={currentOrder}
          removeFromOrder={removeFromOrder}
          updateQuantity={updateQuantity}
          submitOrder={handleSubmitOrder}
          onPaymentClick={handlePaymentClick}
          selectedTableId={selectedTableId}
          loading={isSubmitting}
        />
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        totalAmount={totalAmount}
        tableName={selectedTable?.name ?? ''}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
}
