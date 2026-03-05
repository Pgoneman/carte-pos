import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { Table } from '../../types';
import { getTodayUtcIsoStart } from '../../utils/dateUtils';
import type { PosStore, TableSlice } from './types';

type PaymentAmountRow = {
  amount?: number | null;
};

type TableRow = {
  id: string | number;
  name?: string | null;
  type?: Table['type'] | null;
  status?: Table['status'] | null;
  guests?: number | null;
  start_time?: string | null;
  total_amount?: number | null;
};

function mapTableRow(row: TableRow): Table {
  return {
    id: String(row.id),
    name: row.name ?? '',
    type: row.type ?? 'hall',
    status: row.status ?? 'empty',
    guests: row.guests ?? undefined,
    startTime: row.start_time ? new Date(row.start_time) : undefined,
    totalAmount: row.total_amount ?? 0,
  };
}

export const createTableSlice: StateCreator<PosStore, [], [], TableSlice> = (set, get) => ({
  tables: [],
  selectedTableId: null,
  todaySales: 0,

  fetchTables: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('type')
        .order('name');

      if (error) {
        console.error('fetchTables failed:', error);
        get().showToast('테이블 정보를 불러오지 못했습니다.');
        set({ loading: false });
        return;
      }

      const rows = (data ?? []) as unknown as TableRow[];
      set({ tables: rows.map(mapTableRow), loading: false });
    } catch (error) {
      console.error('fetchTables failed:', error);
      get().showToast('테이블 정보를 불러오지 못했습니다.');
      set({ loading: false });
    }
  },

  selectTable: (id) => set({ selectedTableId: id }),

  setTableOccupied: async (id, guests) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status: 'occupied', guests, start_time: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('setTableOccupied failed:', error);
        get().showToast('테이블 상태를 변경하지 못했습니다.');
        return;
      }

      set({ selectedTableId: id });
      await get().fetchTables();
    } catch (error) {
      console.error('setTableOccupied failed:', error);
      get().showToast('테이블 상태를 변경하지 못했습니다.');
    }
  },

  clearTable: async (id) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status: 'empty', guests: null, start_time: null, total_amount: 0 })
        .eq('id', id);

      if (error) {
        console.error('clearTable failed:', error);
        get().showToast('테이블 초기화에 실패했습니다.');
        return;
      }

      const isSelected = get().selectedTableId === id;
      if (isSelected) {
        get().clearOrder();
        set({ selectedTableId: null });
      }
      await get().fetchTables();
    } catch (error) {
      console.error('clearTable failed:', error);
      get().showToast('테이블 초기화에 실패했습니다.');
    }
  },

  fetchTodaySales: async () => {
    try {
      const todayUtcStart = getTodayUtcIsoStart();
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', todayUtcStart);

      if (error) {
        console.error('fetchTodaySales failed:', error);
        return;
      }

      const rows = (data ?? []) as unknown as PaymentAmountRow[];
      const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
      set({ todaySales: total });
    } catch (error) {
      console.error('fetchTodaySales failed:', error);
    }
  },
});
