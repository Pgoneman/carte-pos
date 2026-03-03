import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { usePosStore } from '../../stores/posStore';
import type { Table } from '../../stores/posStore';

/**
 * POS Dashboard - Takeout / Delivery / Waiting, connected to posStore
 * Slot click → selectTable → /order. Display orders, amount, elapsed time.
 */

function formatElapsed(startTime?: Date): string {
  if (!startTime) return '0:00';
  const sec = Math.floor((Date.now() - startTime.getTime()) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function OrderCard({
  table,
  onClick,
}: {
  table: Table;
  onClick: () => void;
}) {
  const isEmpty = table.status === 'empty' && (table.totalAmount ?? 0) === 0;
  const type = table.type;
  const timer = table.startTime ? formatElapsed(table.startTime) : null;
  const totalPrice = table.totalAmount ?? 0;

  const getBorderColor = () => {
    switch (type) {
      case 'takeout':
        return 'border-purple-600';
      case 'delivery':
        return 'border-teal-500';
      case 'waiting':
        return 'border-gray-400';
      default:
        return 'border-gray-300';
    }
  };

  const getBgColor = () => {
    if (isEmpty) return 'bg-white';
    switch (type) {
      case 'takeout':
        return 'bg-purple-600';
      case 'delivery':
        return 'bg-teal-500';
      case 'waiting':
        return 'bg-gray-500';
      default:
        return 'bg-white';
    }
  };

  const getTextColor = () => {
    return isEmpty ? 'text-gray-500' : 'text-white';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full aspect-[4/3] rounded border-2 ${getBorderColor()} ${getBgColor()} shadow-sm p-3 flex flex-col transition-all hover:brightness-95 cursor-pointer text-left`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-bold ${getTextColor()}`}>
          {isEmpty ? '' : table.name}
        </span>
        {!isEmpty && timer && (
          <span className="text-xs font-medium text-white opacity-90">{timer}</span>
        )}
      </div>

      {!isEmpty && totalPrice > 0 && (
        <div className="mt-auto text-right">
          <span className="text-sm font-bold text-white">
            {totalPrice.toLocaleString()}원
          </span>
        </div>
      )}

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-400">{table.name}</span>
        </div>
      )}
    </button>
  );
}

const SubHeader = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  return (
    <div className="bg-gray-300 border-b border-gray-400 px-4 flex items-center justify-between h-11">
      <div className="flex h-full">
        <button
          onClick={() => onTabChange('hall')}
          type="button"
          className={`px-10 text-sm font-bold h-full transition-colors ${activeTab === 'hall' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'}`}
        >
          기본홀
        </button>
        <button
          onClick={() => onTabChange('takeout')}
          type="button"
          className={`px-10 text-sm font-bold h-full transition-colors ${activeTab === 'takeout' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'}`}
        >
          포장·배달·대기
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="bg-gray-400 hover:bg-gray-500 text-gray-800 text-xs px-3 py-1.5 rounded shadow-sm"
          type="button"
        >
          재출력
        </button>
        <Settings className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
      </div>
    </div>
  );
};

type RowLabelProps = {
  label: string;
  color: 'purple' | 'teal' | 'gray';
};

const RowLabel = ({ label, color }: RowLabelProps) => {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-600',
    teal: 'bg-teal-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={`w-3 h-3 rounded ${colorClasses[color] ?? 'bg-gray-400'}`}
      />
      <span className="text-sm font-bold text-gray-700">{label}</span>
    </div>
  );
};

const ChickMascot = () => {
  return (
    <div className="relative w-16 h-20">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
        <div className="w-10 h-3 bg-white rounded-t-sm border border-gray-300" />
        <div className="w-8 h-5 bg-white mx-auto rounded-t-full border-l border-r border-gray-300" />
      </div>

      <div className="absolute top-6 w-14 h-12 bg-yellow-400 rounded-full border-2 border-yellow-500 mx-auto left-1/2 -translate-x-1/2">
        <div className="relative w-full h-full">
          <div className="absolute top-4 left-1 w-2 h-1 bg-pink-300 rounded-full opacity-60" />
          <div className="absolute top-4 right-1 w-2 h-1 bg-pink-300 rounded-full opacity-60" />
          <div className="absolute top-3 left-3 w-2 h-2 bg-black rounded-full" />
          <div className="absolute top-3 right-3 w-2 h-2 bg-black rounded-full" />
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-4 border-r-4 border-t-4 
            border-l-transparent border-r-transparent border-t-orange-500"
          />
        </div>
      </div>

      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-10 h-6 bg-green-600 rounded-b-lg border-2 border-green-700">
        <div className="w-full h-1 bg-green-700 mt-1" />
      </div>

      <div className="absolute bottom-0 left-3 w-3 h-2 bg-orange-500 rounded-full" />
      <div className="absolute bottom-0 right-3 w-3 h-2 bg-orange-500 rounded-full" />
    </div>
  );
};

/** 본문만 노출 (테이블 페이지 탭 전환 시 재사용) */
export function TakeoutContent() {
  const navigate = useNavigate();
  const { tables, selectTable } = usePosStore();

  const takeoutTables = tables.filter((t) => t.type === 'takeout');
  const deliveryTables = tables.filter((t) => t.type === 'delivery');
  const waitingTables = tables.filter((t) => t.type === 'waiting');

  const handleSlotClick = (table: Table) => {
    selectTable(table.id);
    navigate('/order');
  };

  const takeoutOccupied = takeoutTables.filter((t) => (t.totalAmount ?? 0) > 0).length;
  const deliveryOccupied = deliveryTables.filter((t) => (t.totalAmount ?? 0) > 0).length;
  const waitingOccupied = waitingTables.filter((t) => (t.totalAmount ?? 0) > 0).length;
  const totalSales = [...takeoutTables, ...deliveryTables, ...waitingTables].reduce(
    (sum, t) => sum + (t.totalAmount ?? 0),
    0
  );

  return (
    <>
      <main className="flex-grow p-6 overflow-y-auto relative">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <RowLabel label="포장" color="purple" />
            <div className="grid grid-cols-5 gap-4">
              {takeoutTables.map((table) => (
                <OrderCard key={table.id} table={table} onClick={() => handleSlotClick(table)} />
              ))}
            </div>
          </div>

          <div>
            <RowLabel label="배달" color="teal" />
            <div className="grid grid-cols-5 gap-4">
              {deliveryTables.map((table) => (
                <OrderCard key={table.id} table={table} onClick={() => handleSlotClick(table)} />
              ))}
            </div>
          </div>

          <div>
            <RowLabel label="대기" color="gray" />
            <div className="grid grid-cols-5 gap-4">
              {waitingTables.map((table) => (
                <OrderCard key={table.id} table={table} onClick={() => handleSlotClick(table)} />
              ))}
            </div>
          </div>
        </div>

        <div
          className="fixed bottom-6 right-6 z-50 animate-bounce"
          style={{ animationDuration: '2s' }}
        >
          <ChickMascot />
        </div>
      </main>

      <div className="h-11 bg-gray-800 text-white flex items-center justify-between px-6 text-sm">
        <div className="flex gap-6">
          <span>
            포장: <strong className="text-purple-400">{takeoutOccupied}건</strong>
          </span>
          <span>
            배달: <strong className="text-teal-400">{deliveryOccupied}건</strong>
          </span>
          <span>
            대기: <strong className="text-gray-400">{waitingOccupied}건</strong>
          </span>
        </div>
        <div>
          총 매출: <strong>{totalSales.toLocaleString()}원</strong>
        </div>
      </div>
    </>
  );
}

export default function TakeoutDashboard() {
  const [activeTab, setActiveTab] = useState('takeout');

  return (
    <div className="min-h-screen bg-gray-300 font-sans flex flex-col overflow-hidden">
      <SubHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <TakeoutContent />
    </div>
  );
}
