import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { usePosStore } from '../../stores/posStore';
import type { OrderStatus } from '../../types';

interface HistoryOrderItem {
  name: string;
  price: number;
  quantity: number;
  metadata?: Record<string, unknown>;
}

interface HistoryOrder {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: HistoryOrderItem[];
}

type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: {
    name: string;
    price: number;
    quantity: number;
    metadata?: Record<string, unknown>;
  }[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700' },
  cooking:  { label: 'Cooking',  color: 'bg-orange-100 text-orange-700' },
  ready:    { label: 'Ready',    color: 'bg-green-100 text-green-700' },
  served:   { label: 'Served',   color: 'bg-blue-100 text-blue-700' },
};

interface CustomerOrderHistoryProps {
  refreshKey: number;
  hasAycePass: boolean;
}

export default function CustomerOrderHistory({ refreshKey, hasAycePass }: CustomerOrderHistoryProps) {
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const menus = usePosStore((s) => s.menus);
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const allMenus = useMemo(() => Object.values(menus).flat(), [menus]);

  const fetchHistory = useCallback(async () => {
    if (!selectedTableId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at, order_items(name, price, quantity, metadata)')
        .eq('table_id', selectedTableId)
        .in('status', ['pending', 'cooking', 'ready', 'served'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchHistory failed:', error);
        return;
      }

      const rows = (data ?? []) as unknown as OrderRow[];
      setOrders(
        rows.map((r) => ({
          id: r.id,
          status: r.status as OrderStatus,
          totalAmount: r.total_amount,
          createdAt: r.created_at,
          items: r.order_items ?? [],
        }))
      );
    } catch (err) {
      console.error('fetchHistory failed:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTableId]);

  // Realtime 이벤트 시에도 자동 리프레시
  const realtimeTick = usePosStore((s) => s.realtimeRefreshTick);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey, realtimeTick]);

  const pastTotalAyceAdjusted = useMemo(() => {
    let sum = 0;
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const menu = allMenus.find((m) => m.name === item.name);
        const price = hasAycePass && menu?.isAyce ? 0 : item.price;
        sum += price * item.quantity;
      });
    });
    return sum;
  }, [orders, allMenus, hasAycePass]);

  const formatPrice = (won: number) => `$${(won / 1000).toFixed(0)}`;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && orders.length === 0) {
    return (
      <p className="text-brand-muted text-xs text-center py-4">Loading orders...</p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-brand-muted text-xs text-center py-4">No orders placed yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
        return (
          <div key={order.id} className="bg-brand-cream/50 rounded-xl p-3">
            {/* Order header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-brand-muted">{formatTime(order.createdAt)}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            {/* Items */}
            <div className="space-y-1">
              {order.items.map((item, i) => {
                const menu = allMenus.find((m) => m.name === item.name);
                const isAyce = hasAycePass && (menu?.isAyce ?? false);
                const doneness = item.metadata?.doneness ? String(item.metadata.doneness) : null;
                return (
                  <div key={`${order.id}-${i}`} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{menu?.img || '🍽️'}</span>
                      <span className="text-brand-dark truncate">
                        {item.name} x{item.quantity}
                      </span>
                      {doneness && (
                        <span className="text-[9px] bg-white text-brand-warm px-1 py-0.5 rounded-full shrink-0">
                          {doneness}
                        </span>
                      )}
                    </div>
                    <span className="text-brand-muted shrink-0 ml-2">
                      {isAyce ? 'Incl.' : formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Past orders subtotal */}
      <div className="flex justify-between text-xs font-medium text-brand-warm pt-1 border-t border-brand-cream">
        <span>Orders subtotal</span>
        <span>{formatPrice(pastTotalAyceAdjusted)}</span>
      </div>
    </div>
  );
}

export function useOrderHistoryTotal(refreshKey: number, hasAycePass: boolean) {
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const menus = usePosStore((s) => s.menus);
  const realtimeTick = usePosStore((s) => s.realtimeRefreshTick);
  const [total, setTotal] = useState(0);

  const allMenus = useMemo(() => Object.values(menus).flat(), [menus]);

  useEffect(() => {
    if (!selectedTableId) return;

    const fetchTotal = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_items(name, price, quantity)')
        .eq('table_id', selectedTableId)
        .in('status', ['pending', 'cooking', 'ready', 'served']);

      if (error || !data) return;

      let sum = 0;
      (data as unknown as { order_items: { name: string; price: number; quantity: number }[] }[])
        .forEach((order) => {
          (order.order_items ?? []).forEach((item) => {
            const menu = allMenus.find((m) => m.name === item.name);
            const price = hasAycePass && menu?.isAyce ? 0 : item.price;
            sum += price * item.quantity;
          });
        });
      setTotal(sum);
    };

    fetchTotal();
  }, [selectedTableId, refreshKey, realtimeTick, allMenus, hasAycePass]);

  return total;
}
