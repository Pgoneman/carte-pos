import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { OrderItem, Table } from '../../types';
import type { OrderSlice, PosStore } from './types';
import { markLocalSubmit } from './syncSlice';

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
  serverOrders: [],

  addToOrder: (item) => {
    const current = get().currentOrder;
    const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;

    if (!hasMetadata) {
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

  clearOrder: () => set({ currentOrder: [], serverOrders: [] }),

  submitOrder: async () => {
    const { selectedTableId, currentOrder } = get();
    if (!selectedTableId || currentOrder.length === 0) return;

    set({ loading: true });
    try {
      // 0-quantity 아이템 방어 필터링
      const validOrder = currentOrder.filter((orderItem) => orderItem.quantity > 0);
      if (validOrder.length === 0) {
        get().showToast('유효한 주문 항목이 없습니다.');
        return;
      }

      // AYCE 이용권 감지 — 장바구니 또는 기존 주문에 패스가 있으면 is_ayce 메뉴 0원 처리
      const allMenusList = Object.values(get().menus).flat();
      const cartHasPass = validOrder.some((oi) => {
        const m = allMenusList.find((menu) => menu.id === oi.menuId);
        return m?.isAycePass === true;
      });

      let hasAycePass = cartHasPass;
      if (!cartHasPass) {
        const { data: passCheckData } = await supabase
          .from('orders')
          .select('order_items(name)')
          .eq('table_id', selectedTableId)
          .in('status', ['pending', 'cooking', 'ready', 'served']);

        if (passCheckData) {
          const passNames = allMenusList.filter((m) => m.isAycePass).map((m) => m.name);
          hasAycePass = (passCheckData as unknown as { order_items: { name: string }[] }[]).some(
            (ord) => (ord.order_items ?? []).some((it) => passNames.includes(it.name))
          );
        }
      }

      const totalAmount = validOrder.reduce((sum, orderItem) => {
        const menu = allMenusList.find((m) => m.id === orderItem.menuId);
        const effectivePrice = hasAycePass && menu?.isAyce ? 0 : orderItem.price;
        return sum + effectivePrice * orderItem.quantity;
      }, 0);

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

      const orderItemsPayload = validOrder.map((orderItem) => ({
        order_id: insertedOrder.id,
        menu_id: orderItem.menuId,
        name: orderItem.name,
        price: orderItem.price,
        quantity: orderItem.quantity,
        metadata: orderItem.metadata ?? {},
      }));

      const { error: itemError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemError) {
        console.error('submitOrder insert order_items failed:', itemError);
        await rollbackCreatedOrder(insertedOrder.id);
        get().showToast('주문 항목 저장에 실패했습니다.');
        return;
      }

      // DB에서 최신 total_amount를 직접 조회 (zustand stale state 방지)
      type FreshTableRow = { total_amount: number | null; type: string | null; status: string | null };
      const { data: freshTableData, error: freshError } = await supabase
        .from('tables')
        .select('total_amount, type, status')
        .eq('id', selectedTableId)
        .single();

      let currentDbTotal: number;
      let tableStatus: string;

      if (freshError || !freshTableData) {
        // DB 조회 실패 시 store 데이터를 폴백으로 사용
        console.warn('submitOrder: fresh table query failed, using store fallback');
        const storeTable = get().tables.find((row) => row.id === selectedTableId);
        currentDbTotal = storeTable?.totalAmount ?? 0;
        tableStatus = storeTable?.status ?? 'empty';
      } else {
        const freshTable = freshTableData as unknown as FreshTableRow;
        currentDbTotal = freshTable.total_amount ?? 0;
        tableStatus = freshTable.status ?? 'empty';
      }

      const newTotal = currentDbTotal + totalAmount;
      const updates: TableUpdatePayload = { total_amount: newTotal };
      if (tableStatus !== 'occupied') {
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

      // queueRefresh가 직후에 currentOrder를 재채우지 않도록 마킹
      markLocalSubmit();
      set({ currentOrder: [] });
      get().showToast('주문이 전송되었습니다');
      // 항상 최신 데이터 갱신 (realtime 상태와 무관하게 즉시 반영)
      await get().fetchTables();
      await get().fetchKitchenOrders();
    } catch (error) {
      console.error('submitOrder failed:', error);
      get().showToast('주문 전송에 실패했습니다.');
    } finally {
      set({ loading: false });
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
        set({ serverOrders: [] });
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

      // 0-quantity 아이템 제거 (DB 데이터 방어)
      set({ serverOrders: mergedItems.filter((item) => item.quantity > 0) });
    } catch (error) {
      console.error('fetchTableOrders failed:', error);
      get().showToast('테이블 주문 정보를 불러오지 못했습니다.');
    }
  },

  processCustomerPayment: async (method) => {
    const { selectedTableId } = get();
    if (!selectedTableId) return false;

    const table = get().tables.find((row) => row.id === selectedTableId);
    if (!table) return false;

    const amount = table.totalAmount ?? 0;
    if (amount <= 0) {
      get().showToast('결제할 금액이 없습니다.');
      return false;
    }

    set({ loading: true });
    try {
      // Step 1: 결제 기록 생성
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({ table_id: selectedTableId, amount, method })
        .select('id')
        .single();
      if (paymentError || !paymentData) {
        console.error('processCustomerPayment insert payment failed:', paymentError);
        get().showToast('결제 처리에 실패했습니다.');
        return false;
      }

      // Step 2: 주문 상태 완료 처리
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('table_id', selectedTableId)
        .in('status', ['pending', 'cooking', 'ready', 'served']);
      if (orderError) {
        console.error('processCustomerPayment update orders failed:', orderError);
        await supabase.from('payments').delete().eq('id', paymentData.id);
        get().showToast('주문 완료 처리에 실패하여 결제를 취소했습니다.');
        return false;
      }

      // Step 3: 테이블 상태를 'paid'로 변경 (금액/손님 정보 유지 → POS에서 확인 가능)
      const { error: tableError } = await supabase
        .from('tables')
        .update({ status: 'paid' })
        .eq('id', selectedTableId);
      if (tableError) {
        console.error('processCustomerPayment update table failed:', tableError);
        get().showToast('테이블 상태 업데이트에 실패했습니다.');
        return false;
      }

      await get().fetchTodaySales();
      return true;
    } catch (error) {
      console.error('processCustomerPayment failed:', error);
      get().showToast('결제 처리 중 오류가 발생했습니다.');
      return false;
    } finally {
      set({ loading: false });
    }
  },

  processPayment: async (method) => {
    const { selectedTableId } = get();
    if (!selectedTableId) return false;

    // 결제 시점에 최신 테이블 데이터 조회 (stale state 방지)
    const table = get().tables.find((row) => row.id === selectedTableId);
    if (!table) return false;

    const amount = table.totalAmount ?? 0;
    if (amount <= 0) {
      get().showToast('결제할 금액이 없습니다.');
      return false;
    }

    set({ loading: true });
    try {
      // Step 1: 결제 기록 생성
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({ table_id: selectedTableId, amount, method })
        .select('id')
        .single();
      if (paymentError || !paymentData) {
        console.error('processPayment insert payment failed:', paymentError);
        get().showToast('결제 처리에 실패했습니다.');
        return false;
      }

      // Step 2: 주문 상태 완료 처리
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('table_id', selectedTableId)
        .in('status', ['pending', 'cooking', 'ready', 'served']);
      if (orderError) {
        console.error('processPayment update orders failed:', orderError);
        // 보상 트랜잭션: Step 1에서 생성한 결제 기록 롤백
        await supabase.from('payments').delete().eq('id', paymentData.id);
        get().showToast('주문 완료 처리에 실패하여 결제를 취소했습니다.');
        return false;
      }

      // Step 3: 테이블 초기화 + 매출 갱신
      await get().clearTable(selectedTableId);
      await get().fetchTodaySales();
      return true;
    } catch (error) {
      console.error('processPayment failed:', error);
      get().showToast('결제 처리 중 오류가 발생했습니다.');
      return false;
    } finally {
      set({ loading: false });
    }
  },
});
