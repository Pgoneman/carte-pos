import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePosStore } from '../stores/posStore';
import CustomerOrderPanel from '../components/customer/CustomerOrderPanel';

export default function CustomerOrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const selectTable = usePosStore((s) => s.selectTable);
  const fetchMenus = usePosStore((s) => s.fetchMenus);
  const fetchTables = usePosStore((s) => s.fetchTables);
  const clearOrder = usePosStore((s) => s.clearOrder);
  const startRealtimeSync = usePosStore((s) => s.startRealtimeSync);
  const stopRealtimeSync = usePosStore((s) => s.stopRealtimeSync);

  useEffect(() => {
    if (tableId) {
      selectTable(tableId);
      fetchMenus();
      fetchTables();
    }
    return () => {
      selectTable(null);
      clearOrder();
    };
  }, [tableId, selectTable, fetchMenus, fetchTables, clearOrder]);

  // 고객 페이지에서도 Realtime 구독 — 동일 테이블 합석자 주문 실시간 반영
  useEffect(() => {
    startRealtimeSync();
    return () => stopRealtimeSync();
  }, [startRealtimeSync, stopRealtimeSync]);

  if (!tableId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream font-body">
        <p className="text-brand-warm text-lg">Invalid table link.</p>
      </div>
    );
  }

  return <CustomerOrderPanel />;
}
