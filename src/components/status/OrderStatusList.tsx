import { useState, useEffect } from 'react';
import {
  RefreshCw,
  ChevronDown,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { usePosStore } from '../../stores/posStore';
import type { KitchenOrder } from '../../stores/posStore';
import { useTimeAgo } from '../../hooks/useElapsedTime';

/**
 * POS Order Status - 진행 → 준비완료 → 서빙완료 → 최종완료 / 완료취소
 */



const STATUS_TABS = [
  { key: 'pending', label: '진행', statuses: ['pending', 'cooking'] },
  { key: 'ready', label: '준비완료', statuses: ['ready'] },
  { key: 'served', label: '서빙완료', statuses: ['served'] },
  { key: 'cancelled', label: '취소', statuses: ['cancelled'] },
] as const;

const ChickMascot = () => (
  <div className="relative w-14 h-18">
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
      <div className="w-9 h-2.5 bg-white rounded-t-sm border border-gray-300" />
      <div className="w-7 h-4 bg-white mx-auto rounded-t-full border-l border-r border-gray-300" />
    </div>
    <div className="absolute top-5 w-12 h-10 bg-yellow-400 rounded-full border-2 border-yellow-500 mx-auto left-1/2 -translate-x-1/2">
      <div className="relative w-full h-full">
        <div className="absolute top-3 left-1 w-1.5 h-1 bg-pink-300 rounded-full opacity-60" />
        <div className="absolute top-3 right-1 w-1.5 h-1 bg-pink-300 rounded-full opacity-60" />
        <div className="absolute top-2 left-2.5 w-1.5 h-1.5 bg-black rounded-full" />
        <div className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-black rounded-full" />
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-[3px] border-r-[3px] border-t-[3px] 
            border-l-transparent border-r-transparent border-t-orange-500"
        />
      </div>
    </div>
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-8 h-5 bg-green-600 rounded-b-lg border-2 border-green-700">
      <div className="w-full h-0.5 bg-green-700 mt-0.5" />
    </div>
    <div className="absolute bottom-0 left-2.5 w-2.5 h-1.5 bg-orange-500 rounded-full" />
    <div className="absolute bottom-0 right-2.5 w-2.5 h-1.5 bg-orange-500 rounded-full" />
  </div>
);

function getOrderStyle(status: string) {
  switch (status) {
    case 'cancelled':
      return { headerBg: 'bg-gray-200', typeColor: 'bg-gray-500', textColor: 'text-gray-600', timeColor: 'text-gray-500', label: '취소' };
    case 'completed':
      return { headerBg: 'bg-green-100', typeColor: 'bg-green-500', textColor: 'text-green-700', timeColor: 'text-green-600', label: '완료' };
    case 'served':
      return { headerBg: 'bg-blue-100', typeColor: 'bg-blue-500', textColor: 'text-blue-700', timeColor: 'text-blue-600', label: '서빙완료' };
    case 'ready':
      return { headerBg: 'bg-amber-100', typeColor: 'bg-amber-500', textColor: 'text-amber-800', timeColor: 'text-amber-600', label: '준비완료' };
    default:
      return { headerBg: 'bg-pink-200', typeColor: 'bg-gray-400', textColor: 'text-pink-600', timeColor: 'text-red-500', label: '진행' };
  }
}

function OrderCard({
  order,
  onReady,
  onServed,
  onComplete,
  onRevert,
}: {
  order: KitchenOrder;
  onReady: (id: string) => void;
  onServed: (id: string) => void;
  onComplete: (id: string) => void;
  onRevert: (id: string, toStatus: string) => void;
}) {
  const style = getOrderStyle(order.status);
  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';
  const timeAgo = useTimeAgo(order.createdAt);

  return (
    <div className="w-72 bg-white rounded-lg shadow-md overflow-hidden">
      <div className={`${style.headerBg} px-3 py-2.5 flex justify-between items-center`}>
        <div className="flex items-center">
          <div className={`w-5 h-5 ${style.typeColor} rounded-full flex items-center justify-center mr-2`}>
            <span className="text-white text-xs font-bold">{style.label}</span>
          </div>
          <span className={`${style.textColor} font-bold text-sm flex items-center`}>
            {order.tableId}
            <ChevronRight size={14} className="ml-0.5" />
          </span>
        </div>
        <span className={`${style.timeColor} text-xs font-medium`}>
          {timeAgo}
        </span>
      </div>

      <div className="p-4 min-h-[140px]">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex mb-2.5">
            <span className="font-bold text-gray-800 w-6">{item.quantity}</span>
            <span className="text-gray-800">{item.name}</span>
          </div>
        ))}
      </div>

      {!isCancelled && !isCompleted && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {(order.status === 'pending' || order.status === 'cooking') && (
            <button
              type="button"
              onClick={() => onReady(order.id)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-md transition-colors"
            >
              준비완료
            </button>
          )}
          {order.status === 'ready' && (
            <button
              type="button"
              onClick={() => onServed(order.id)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-md transition-colors"
            >
              서빙완료
            </button>
          )}
          {order.status === 'served' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onComplete(order.id)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-md transition-colors"
              >
                최종완료
              </button>
              <button
                type="button"
                onClick={() => onRevert(order.id, 'ready' as string)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-md transition-colors"
              >
                완료취소
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderStatusList() {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const {
    kitchenOrders,
    fetchKitchenOrders,
    setOrderReady,
    setOrderServed,
    completeOrder,
    revertOrderStatus,
    completeAllOrders,
  } = usePosStore();

  useEffect(() => {
    fetchKitchenOrders();
  }, [fetchKitchenOrders]);

  const currentTab = STATUS_TABS.find((t) => t.key === activeTab) ?? STATUS_TABS[0];
  const statusesList = currentTab.statuses as readonly string[];
  const filteredOrders = kitchenOrders.filter((o) => statusesList.includes(o.status));

  return (
    <div className="flex flex-col h-screen w-full bg-gray-200 font-sans overflow-hidden">
      <div className="h-12 bg-gray-100 border-b border-gray-300 flex items-center justify-between px-4 shrink-0">
        <div className="flex gap-2 mb-0">
          {STATUS_TABS.map((tab) => {
            const tabStatuses = tab.statuses as readonly string[];
            const count = kitchenOrders.filter((o) => tabStatuses.includes(o.status)).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {tab.label}
                {count > 0 && <span className="ml-1">({count})</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
            type="button"
            onClick={() => fetchKitchenOrders()}
          >
            <RefreshCw size={16} className="text-gray-600" />
          </button>
          <button
            className="flex items-center bg-white border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
            type="button"
          >
            <span className="text-sm text-gray-600 mr-1">주문표시</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          <button
            className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            type="button"
            onClick={completeAllOrders}
          >
            전체완료
          </button>
          <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50" type="button">
            <Settings size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 overflow-auto relative">
        <div className="flex flex-wrap gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onReady={(id) => setOrderReady(id)}
              onServed={(id) => setOrderServed(id)}
              onComplete={(id) => completeOrder(id)}
              onRevert={(id, toStatus) => revertOrderStatus(id, toStatus)}
            />
          ))}

          {activeTab === 'pending' && filteredOrders.length === 0 && (
            <div className="w-72 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">새 주문 대기중...</span>
            </div>
          )}
        </div>

        <div className="fixed bottom-6 right-6 z-40">
          <ChickMascot />
        </div>
      </main>

      <div className="h-10 bg-gray-800 text-white flex items-center justify-between px-4 text-sm shrink-0">
        <div className="flex gap-6">
          <span>
            진행: <strong className="text-blue-400">{kitchenOrders.filter((o) => ['pending', 'cooking'].includes(o.status)).length}건</strong>
          </span>
          <span>
            준비완료: <strong className="text-amber-400">{kitchenOrders.filter((o) => o.status === 'ready').length}건</strong>
          </span>
          <span>
            서빙완료: <strong className="text-blue-300">{kitchenOrders.filter((o) => o.status === 'served').length}건</strong>
          </span>
          <span>
            완료: <strong className="text-green-400">{kitchenOrders.filter((o) => o.status === 'completed').length}건</strong>
          </span>
          <span>
            취소: <strong className="text-red-400">{kitchenOrders.filter((o) => o.status === 'cancelled').length}건</strong>
          </span>
        </div>
        <div>
          오늘 총 주문: <strong>{kitchenOrders.length}건</strong>
        </div>
      </div>
    </div>
  );
}
