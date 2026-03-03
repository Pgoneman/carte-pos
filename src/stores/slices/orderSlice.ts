import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { OrderItem, Table } from '../../types';
import type { OrderSlice, PosStore } from './types';

type OrderRow = {
  id: string;
  status?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
  order_items?: OrderItemRow[] | null;
};

type OrderItemRow = {
  id?: string | null;
  menu_id?: string | number | null;
  name?: string | null;
  price?: number | null;
  quantity?: number | null;
};

type OrderInsertResult = {
  id: string;
};

type TableUpdatePayload = {
  total_amount: number;
  status?: Table['status'];
  start_time?: string;
};

async function rollbackCreatedOrder(orderId: string): Promise<void> {
  try {
    const { error: itemDeleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);
    if (itemDeleteError) {
      console.error('rollback order_items failed:', itemDeleteError);
    }

    const { error: orderDeleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    if (orderDeleteError) {
      console.error('rollback orders failed:', orderDeleteError);
    }
  } catch (error) {
    console.error('rollbackCreatedOrder failed:', error);
  }
}

export const createOrderSlice: StateCreator<PosStore, [], [], OrderSlice> = (set, get) => ({
  currentOrder: [],

  addToOrder: (item) => {
    const current = get().currentOrder;
    const existing = current.find((orderItem) => orderItem.menuId === item.menuId);
    if (existing) {
      set({
        currentOrder: current.map((orderItem) =>
          orderItem.menuId === item.menuId
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        ),
      });
      return;
    }

    set({ currentOrder: [...current, { ...item, quantity: 1 }] });
  },

  removeFromOrder: (menuId) => {
    set({ currentOrder: get().currentOrder.filter((item) => item.menuId !== menuId) });
  },

  updateQuantity: (menuId, quantity) => {
    if (quantity <= 0) {
      get().removeFromOrder(menuId);
      return;
    }

    set({
      currentOrder: get().currentOrder.map((item) =>
        item.menuId === menuId ? { ...item, quantity } : item
      ),
    });
  },

  clearOrder: () => set({ currentOrder: [] }),

  submitOrder: async () => {
    const { selectedTableId, currentOrder, tables } = get();
    if (!selectedTableId || currentOrder.length === 0) return;

    try {
      const totalAmount = currentOrder.reduce(
        (sum, orderItem) => sum + orderItem.price * orderItem.quantity,
        0
      );

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ table_id: selectedTableId, status: 'pending', total_amount: totalAmount })
        .select()
        .single();

      if (orderError) {
        console.error('submitOrder insert order failed:', orderError);
        get().showToast('주문 전송에 실패했습니다.');
        return;
      }

      const insertedOrder = order as unknown as OrderInsertResult | null;
      if (!insertedOrder?.id) {
        get().showToast('주문 전송에 실패했습니다.');
        return;
      }

      const orderItemsPayload = currentOrder.map((orderItem) => ({
        order_id: insertedOrder.id,
        menu_id: orderItem.menuId,
        name: orderItem.name,
        price: orderItem.price,
        quantity: orderItem.quantity,
      }));

      const { error: itemError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemError) {
        console.error('submitOrder insert order_items failed:', itemError);
        await rollbackCreatedOrder(insertedOrder.id);
        get().showToast('주문 항목 저장에 실패했습니다.');
        return;
      }

      const table = tables.find((row) => row.id === selectedTableId);
      const newTotal = (table?.totalAmount ?? 0) + totalAmount;
      const updates: TableUpdatePayload = { total_amount: newTotal };
      if (table?.type !== 'hall') {
        updates.status = 'occupied';
        updates.start_time = new Date().toISOString();
      }

      const { error: tableError } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', selectedTableId);
      if (tableError) {
        console.error('submitOrder update table failed:', tableError);
        await rollbackCreatedOrder(insertedOrder.id);
        get().showToast('테이블 금액 업데이트에 실패했습니다.');
        return;
      }

      set({ currentOrder: [] });
      get().showToast('주문이 전송되었습니다');
      // Realtime 미연결 시에만 수동 fetch (연결 중이면 queueRefresh가 자동 처리)
      if (!get().realtimeConnected) {
        await get().fetchTables();
        await get().fetchKitchenOrders();
      }
    } catch (error) {
      console.error('submitOrder failed:', error);
      get().showToast('주문 전송에 실패했습니다.');
    }
  },

  fetchTableOrders: async (tableId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          status,
          total_amount,
          created_at,
          order_items (
            id,
            menu_id,
            name,
            price,
            quantity
          )
        `
        )
        .eq('table_id', tableId)
        .in('status', ['pending', 'cooking', 'ready', 'served', 'completed'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('fetchTableOrders failed:', error);
        get().showToast('테이블 주문 정보를 불러오지 못했습니다.');
        return;
      }

      const rows = (data ?? []) as unknown as OrderRow[];
      if (rows.length === 0) {
        set({ currentOrder: [] });
        return;
      }

      const mergedItems: OrderItem[] = [];
      rows.forEach((orderRow) => {
        (orderRow.order_items ?? []).forEach((item) => {
          const menuId = String(item.menu_id ?? '');
          const existing = mergedItems.find((orderItem) => orderItem.menuId === menuId);
          if (existing) {
            existing.quantity += item.quantity ?? 1;
            return;
          }

          mergedItems.push({
            menuId,
            name: item.name ?? '',
            price: item.price ?? 0,
            quantity: item.quantity ?? 1,
          });
        });
      });

      set({ currentOrder: mergedItems });
    } catch (error) {
      console.error('fetchTableOrders failed:', error);
      get().showToast('테이블 주문 정보를 불러오지 못했습니다.');
    }
  },

  processPayment: async (method) => {
    const { selectedTableId, tables } = get();
    if (!selectedTableId) return;

    const table = tables.find((row) => row.id === selectedTableId);
    if (!table) return;

    try {
      const { error: paymentError } = await supabase.from('payments').insert({
        table_id: selectedTableId,
        amount: table.totalAmount ?? 0,
        method,
      });
      if (paymentError) {
        console.error('processPayment insert payment failed:', paymentError);
        get().showToast('결제 처리에 실패했습니다.');
        return;
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('table_id', selectedTableId)
        .in('status', ['pending', 'cooking', 'ready', 'served']);
      if (orderError) {
        console.error('processPayment update orders failed:', orderError);
        get().showToast('결제 처리에 실패했습니다.');
        return;
      }

      await get().clearTable(selectedTableId);
    } catch (error) {
      console.error('processPayment failed:', error);
      get().showToast('결제 처리에 실패했습니다.');
    }
  },
});
