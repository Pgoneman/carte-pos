import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { KitchenOrder } from '../../types';
import type { KitchenSlice, PosStore } from './types';

type OrderItemRow = {
  name?: string | null;
  price?: number | null;
  quantity?: number | null;
};

type KitchenOrderRow = {
  id: string;
  table_id?: string | null;
  status?: string | null;
  total_amount?: number | null;
  created_at: string;
  tables?: {
    name?: string | null;
    type?: string | null;
  } | null;
  order_items?: OrderItemRow[] | null;
};

function mapKitchenOrderRow(row: KitchenOrderRow): KitchenOrder {
  return {
    id: row.id,
    tableId: row.tables?.name ?? row.table_id ?? '',
    status: row.status ?? 'pending',
    total_amount: row.total_amount ?? 0,
    createdAt: new Date(row.created_at),
    items: (row.order_items ?? []).map((item) => ({
      name: item.name ?? '',
      price: item.price ?? 0,
      quantity: item.quantity ?? 0,
    })),
  };
}

// KST(UTC+9) day start converted to UTC ISO, e.g. KST 00:00 -> previous day 15:00Z
function getTodayUtcIsoStart(): string {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - KST_OFFSET_MS).toISOString();
}

export const createKitchenSlice: StateCreator<PosStore, [], [], KitchenSlice> = (
  set,
  get
) => ({
  kitchenOrders: [],

  fetchKitchenOrders: async () => {
    try {
      const todayUtcStart = getTodayUtcIsoStart();
      const { data, error } = await supabase
        .from('orders')
        .select('*, tables(name, type), order_items(name, price, quantity)')
        .in('status', ['pending', 'cooking', 'ready', 'served', 'completed', 'cancelled'])
        .gte('created_at', todayUtcStart)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchKitchenOrders failed:', error);
        get().showToast('주방 주문 정보를 불러오지 못했습니다.');
        return;
      }

      const rows = (data ?? []) as unknown as KitchenOrderRow[];
      set({ kitchenOrders: rows.map(mapKitchenOrderRow) });
    } catch (error) {
      console.error('fetchKitchenOrders failed:', error);
      get().showToast('주방 주문 정보를 불러오지 못했습니다.');
    }
  },

  completeOrder: async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) {
        console.error('completeOrder failed:', error);
        get().showToast('주문 상태 변경에 실패했습니다.');
        return;
      }

      await get().fetchKitchenOrders();
    } catch (error) {
      console.error('completeOrder failed:', error);
      get().showToast('주문 상태 변경에 실패했습니다.');
    }
  },

  completeAllOrders: async () => {
    try {
      const todayUtcStart = getTodayUtcIsoStart();
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .in('status', ['pending', 'cooking', 'ready', 'served'])
        .gte('created_at', todayUtcStart);

      if (error) {
        console.error('completeAllOrders failed:', error);
        get().showToast('전체 완료 처리에 실패했습니다.');
        return;
      }

      await get().fetchKitchenOrders();
    } catch (error) {
      console.error('completeAllOrders failed:', error);
      get().showToast('전체 완료 처리에 실패했습니다.');
    }
  },

  setOrderReady: async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderId);

      if (error) {
        console.error('setOrderReady failed:', error);
        get().showToast('주문 상태 변경에 실패했습니다.');
        return;
      }

      await get().fetchKitchenOrders();
    } catch (error) {
      console.error('setOrderReady failed:', error);
      get().showToast('주문 상태 변경에 실패했습니다.');
    }
  },

  setOrderServed: async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'served' })
        .eq('id', orderId);

      if (error) {
        console.error('setOrderServed failed:', error);
        get().showToast('주문 상태 변경에 실패했습니다.');
        return;
      }

      await get().fetchKitchenOrders();
    } catch (error) {
      console.error('setOrderServed failed:', error);
      get().showToast('주문 상태 변경에 실패했습니다.');
    }
  },

  revertOrderStatus: async (orderId, toStatus = 'ready') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: toStatus })
        .eq('id', orderId);

      if (error) {
        console.error('revertOrderStatus failed:', error);
        get().showToast('주문 상태 변경에 실패했습니다.');
        return;
      }

      await get().fetchKitchenOrders();
    } catch (error) {
      console.error('revertOrderStatus failed:', error);
      get().showToast('주문 상태 변경에 실패했습니다.');
    }
  },
});
