import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { usePosStore } from '../../stores/posStore';
import type { Table } from '../../stores/posStore';
import { TakeoutContent } from '../takeout/TakeoutDashboard';
import TableNumberpad from './TableNumberpad';
import { useElapsedTime } from '../../hooks/useElapsedTime';

/**
 * Restaurant Table Management UI
 * Replicates the provided screenshot with pixel-perfect attention to detail.
 */



const TableCard = ({
  id,
  name,
  status,
  startTime,
  guests,
  totalAmount,
  onClick,
  onClear,
}: {
  id: string;
  name: string;
  status: Table['status'];
  startTime?: Date;
  guests?: number;
  totalAmount?: number;
  onClick?: () => void;
  onClear?: () => void;
}) => {
  const isOccupied = status === 'occupied';
  const isPaid = status === 'paid';
  const time = useElapsedTime(isOccupied ? startTime : undefined);

  const baseClasses =
    'w-full h-28 rounded-sm p-3 flex flex-col justify-between shadow-sm transition-all cursor-pointer hover:scale-105 relative';

  let statusClasses = '';
  if (status === 'paid') {
    statusClasses = 'bg-green-500 text-white';
  } else if (status === 'occupied') {
    statusClasses = 'bg-red-500 text-white';
  } else if (status === 'empty') {
    statusClasses = 'bg-white border-2 border-blue-400 text-gray-500';
  } else if (status === 'reserved') {
    statusClasses = 'bg-white border-2 border-orange-400 text-gray-500';
  }

  const handleCustomerLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/customer/${id}`, '_blank');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      const confirmed = window.confirm(`${name} 테이블을 초기화하시겠습니까?\n(주문 내역과 금액이 모두 삭제됩니다)`);
      if (confirmed) onClear();
    }
  };

  return (
    <div
      className={`${baseClasses} ${statusClasses}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Top-right buttons */}
      <div className="absolute top-1 right-1 flex gap-1 z-10">
        {(isOccupied || isPaid) && (
          <button
            type="button"
            onClick={handleClear}
            title="테이블 초기화"
            className="w-6 h-6 rounded flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition-opacity bg-white/20 text-white hover:bg-white/40"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          onClick={handleCustomerLink}
          title="고객 주문 화면 열기"
          className={`w-6 h-6 rounded flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition-opacity ${
            isOccupied || isPaid
              ? 'bg-white/20 text-white hover:bg-white/40'
              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
          }`}
        >
          QR
        </button>
      </div>

      <div className="flex justify-between items-start">
        <span
          className={`text-sm font-bold ${isOccupied || isPaid ? 'text-white' : 'text-gray-500 w-full text-center mt-2'}`}
        >
          {name}
        </span>
        {isOccupied && (
          <span className="text-xs font-medium opacity-90">{time}</span>
        )}
      </div>

      {isOccupied && (
        <div className="flex justify-between items-end">
          <span className="text-xs font-medium">{guests ?? 0}명</span>
          <span className="text-base font-bold">{(totalAmount ?? 0).toLocaleString()}원</span>
        </div>
      )}

      {isPaid && (
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold">결제완료</span>
          <span className="text-base font-bold">{(totalAmount ?? 0).toLocaleString()}원</span>
        </div>
      )}
    </div>
  );
};

const SubHeader = ({
  activeTab,
  onTabChange,
}: {
  activeTab: 'hall' | 'takeout';
  onTabChange: (tab: 'hall' | 'takeout') => void;
}) => {
  const buttons = [
    '자리이동',
    '합석',
    '단체손님',
    '재출력',
    '돈통열기',
    '결제내역',
  ];

  return (
    <div className="h-12 bg-gray-300 border-b border-gray-400 flex items-center justify-between">
      <div className="flex h-full">
        <button
          onClick={() => onTabChange('hall')}
          className={`px-10 h-full font-bold text-sm flex items-center justify-center bg-gray-300 transition-colors ${activeTab === 'hall'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500 hover:bg-gray-200'
            }`}
          type="button"
        >
          기본홀
        </button>
        <button
          onClick={() => onTabChange('takeout')}
          className={`px-10 h-full font-bold text-sm flex items-center justify-center bg-gray-300 transition-colors ${activeTab === 'takeout'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500 hover:bg-gray-200'
            }`}
          type="button"
        >
          포장·배달·대기
        </button>
      </div>

      <div className="flex items-center gap-1 pr-4">
        {buttons.map((label) => (
          <button
            key={label}
            className="bg-gray-400 hover:bg-gray-500 text-gray-800 text-xs px-3 py-1.5 rounded shadow-sm transition-colors"
            type="button"
          >
            {label}
          </button>
        ))}
        <button
          className="ml-2 text-gray-600 hover:text-gray-800 text-xl"
          type="button"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

const ChickMascot = () => {
  return (
    <div className="relative w-16 h-20">
      {/* Chef Hat */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
        <div className="w-10 h-3 bg-white rounded-t-sm border border-gray-300" />
        <div className="w-8 h-5 bg-white mx-auto rounded-t-full border-l border-r border-gray-300" />
      </div>

      {/* Body */}
      <div className="absolute top-6 w-14 h-12 bg-yellow-400 rounded-full border-2 border-yellow-500 mx-auto left-1/2 -translate-x-1/2">
        {/* Face */}
        <div className="relative w-full h-full">
          {/* Blush */}
          <div className="absolute top-4 left-1 w-2 h-1 bg-pink-300 rounded-full opacity-60" />
          <div className="absolute top-4 right-1 w-2 h-1 bg-pink-300 rounded-full opacity-60" />

          {/* Eyes */}
          <div className="absolute top-3 left-3 w-2 h-2 bg-black rounded-full" />
          <div className="absolute top-3 right-3 w-2 h-2 bg-black rounded-full" />

          {/* Beak */}
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-4 border-r-4 border-t-4 
            border-l-transparent border-r-transparent border-t-orange-500"
          />
        </div>
      </div>

      {/* Apron */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-10 h-6 bg-green-600 rounded-b-lg border-2 border-green-700">
        <div className="w-full h-1 bg-green-700 mt-1" />
      </div>

      {/* Feet */}
      <div className="absolute bottom-0 left-3 w-3 h-2 bg-orange-500 rounded-full" />
      <div className="absolute bottom-0 right-3 w-3 h-2 bg-orange-500 rounded-full" />
    </div>
  );
};

export default function TableOverview() {
  const [activeTab, setActiveTab] = useState<'hall' | 'takeout'>('hall');
  const [selectedTableForModal, setSelectedTableForModal] = useState<Table | null>(null);
  const [isNumberpadOpen, setIsNumberpadOpen] = useState(false);
  const navigate = useNavigate();
  const { tables, fetchTables, setTableOccupied, selectTable, clearTable, todaySales, fetchTodaySales } = usePosStore(
    useShallow((s) => ({
      tables: s.tables,
      fetchTables: s.fetchTables,
      setTableOccupied: s.setTableOccupied,
      selectTable: s.selectTable,
      clearTable: s.clearTable,
      todaySales: s.todaySales,
      fetchTodaySales: s.fetchTodaySales,
    }))
  );

  useEffect(() => {
    fetchTables();
    fetchTodaySales();
  }, [fetchTables, fetchTodaySales]);

  const hallTables = [...tables.filter((t) => t.type === 'hall')].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  const handleTableClick = (table: Table) => {
    if (table.status === 'empty') {
      setSelectedTableForModal(table);
      setIsNumberpadOpen(true);
    } else if (table.status === 'occupied' || table.status === 'paid') {
      selectTable(table.id);
      navigate('/order');
    }
  };

  const handleConfirmGuests = async (guests: number) => {
    if (!selectedTableForModal || guests <= 0) return;
    const tableId = selectedTableForModal.id;
    await setTableOccupied(tableId, guests);
    selectTable(tableId);
    setIsNumberpadOpen(false);
    setSelectedTableForModal(null);
    navigate('/order');
  };

  const occupiedCount = hallTables.filter((t) => t.status === 'occupied').length;
  const paidCount = hallTables.filter((t) => t.status === 'paid').length;
  const reservedCount = hallTables.filter((t) => t.status === 'reserved').length;
  const emptyCount = hallTables.filter((t) => t.status === 'empty').length;
  const totalGuests = hallTables
    .filter((t) => t.status === 'occupied')
    .reduce((sum, t) => sum + (t.guests ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-300 font-sans select-none overflow-hidden flex flex-col">
      <SubHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'hall' && (
        <>
          <div className="flex-1 relative p-6 overflow-y-auto">
            <div className="flex gap-4 text-xs mb-4">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>사용중</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span>결제완료</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-white border-2 border-orange-400 rounded" />
                <span>예약</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded" />
                <span>빈 테이블</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {hallTables.map((t) => (
                <TableCard
                  key={t.id}
                  id={t.id}
                  name={t.name}
                  status={t.status}
                  startTime={t.startTime}
                  guests={t.guests}
                  totalAmount={t.totalAmount}
                  onClick={() => handleTableClick(t)}
                  onClear={() => clearTable(t.id)}
                />
              ))}
            </div>

            <div
              className="fixed bottom-20 right-8 animate-bounce z-10"
              style={{ animationDuration: '2s' }}
            >
              <ChickMascot />
            </div>
          </div>

          <div className="h-12 bg-gray-800 text-white flex items-center justify-between px-6 text-sm">
            <div className="flex gap-8">
              <span>
                전체 테이블: <strong>{hallTables.length}</strong>
              </span>
              <span>
                사용중: <strong className="text-red-400">{occupiedCount}</strong>
              </span>
              <span>
                결제완료: <strong className="text-green-400">{paidCount}</strong>
              </span>
              <span>
                예약: <strong className="text-orange-400">{reservedCount}</strong>
              </span>
              <span>
                빈 테이블: <strong className="text-blue-400">{emptyCount}</strong>
              </span>
            </div>
            <div className="flex gap-8">
              <span>
                총 손님: <strong>{totalGuests}명</strong>
              </span>
              <span>
                오늘 매출: <strong className="text-green-400">{todaySales.toLocaleString()}원</strong>
              </span>
            </div>
          </div>

          <TableNumberpad
            isOpen={isNumberpadOpen}
            onClose={() => {
              setIsNumberpadOpen(false);
              setSelectedTableForModal(null);
            }}
            onConfirm={handleConfirmGuests}
            tableName={selectedTableForModal?.name ?? ''}
          />
        </>
      )}

      {activeTab === 'takeout' && <TakeoutContent />}
    </div>
  );
}
