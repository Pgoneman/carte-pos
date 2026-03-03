import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { Reservation } from '../../types';
import type { PosStore, ReservationSlice } from './types';

type ReservationRow = {
  id: string;
  customer_name: string;
  phone_number: string;
  reservation_date: string;
  guests: number;
  table_id: string | null;
  status: Reservation['status'];
  created_at: string;
};

export const createReservationSlice: StateCreator<
  PosStore,
  [],
  [],
  ReservationSlice
> = (set, get) => ({
  reservations: [],
  isReservationModalOpen: false,

  openReservationModal: () => set({ isReservationModalOpen: true }),
  closeReservationModal: () => set({ isReservationModalOpen: false }),

  fetchReservations: async () => {
    try {
      // 오늘 자정(KST) 이후 예약만 조회
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .gte('reservation_date', todayStart.toISOString())
        .order('reservation_date', { ascending: true });

      if (error) {
        console.error('fetchReservations failed:', error);
        get().showToast('예약 정보를 불러오지 못했습니다.');
        return;
      }

      const rows = (data ?? []) as unknown as ReservationRow[];
      const formatted: Reservation[] = rows.map((row) => ({
        id: row.id,
        customerName: row.customer_name,
        phoneNumber: row.phone_number,
        reservationDate: row.reservation_date,
        guests: row.guests,
        tableId: row.table_id,
        status: row.status,
        createdAt: new Date(row.created_at),
      }));

      set({ reservations: formatted });
    } catch (error) {
      console.error('fetchReservations failed:', error);
      get().showToast('예약 정보를 불러오지 못했습니다.');
    }
  },

  createReservation: async (payload) => {
    const { showToast, fetchReservations } = get();

    const dbPayload = {
      customer_name: payload.customerName,
      phone_number: payload.phoneNumber,
      reservation_date: payload.reservationDate,
      guests: payload.guests,
      table_id: payload.tableId,
      status: 'confirmed' as const,
    };

    try {
      const { error } = await supabase.from('reservations').insert(dbPayload);

      if (error) {
        console.error('createReservation failed:', error);
        showToast('예약 등록에 실패했습니다.');
        return false;
      }

      showToast('예약이 성공적으로 등록되었습니다.');
      await fetchReservations();
      get().closeReservationModal();
      return true;
    } catch (error) {
      console.error('createReservation failed:', error);
      showToast('예약 등록에 실패했습니다.');
      return false;
    }
  },
});
