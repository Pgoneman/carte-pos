import type { RealtimeChannel } from '@supabase/supabase-js';
import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { PosStore, SyncSlice } from './types';

let realtimeChannel: RealtimeChannel | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let isManuallyStopped = false;

const REFRESH_DEBOUNCE_MS = 200;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

function queueRefresh(get: () => PosStore) {
  if (refreshTimer) clearTimeout(refreshTimer);

  refreshTimer = setTimeout(() => {
    void get().fetchTables();
    void get().fetchKitchenOrders();

    const selectedTableId = get().selectedTableId;
    if (selectedTableId) {
      void get().fetchTableOrders(selectedTableId);
    }
  }, REFRESH_DEBOUNCE_MS);
}

function clearRealtimeChannel() {
  if (!realtimeChannel) return;
  void supabase.removeChannel(realtimeChannel);
  realtimeChannel = null;
}

function clearReconnectTimer() {
  if (!reconnectTimer) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

export const createSyncSlice: StateCreator<PosStore, [], [], SyncSlice> = (set, get) => ({
  realtimeConnected: false,

  startRealtimeSync: () => {
    try {
      isManuallyStopped = false;
      if (realtimeChannel) return;

      realtimeChannel = supabase
        .channel('pos-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => queueRefresh(get)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tables' },
          () => queueRefresh(get)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menus' },
          () => void get().fetchMenus()
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // 재연결 성공 시에만 토스트 (최초 연결은 조용히)
            if (reconnectAttempt > 0) {
              get().showToast('실시간 동기화가 재연결되었습니다.');
            }
            set({ realtimeConnected: true });
            reconnectAttempt = 0;
            clearReconnectTimer();
            return;
          }

          if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            set({ realtimeConnected: false });
            // 채널 status 콜백 내 동기 removeChannel은 재진입 위험이 있으므로
            // 다음 이벤트 루프 태스크로 분리
            setTimeout(clearRealtimeChannel, 0);
            if (isManuallyStopped) return;

            const delay = Math.min(
              RECONNECT_BASE_MS * 2 ** reconnectAttempt,
              RECONNECT_MAX_MS
            );
            reconnectAttempt += 1;

            clearReconnectTimer();
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              if (isManuallyStopped) return;
              get().startRealtimeSync();
            }, delay);
          }
        });
    } catch (error) {
      console.error('startRealtimeSync failed:', error);
      set({ realtimeConnected: false });
      get().showToast('실시간 동기화 연결에 실패했습니다.');
    }
  },

  stopRealtimeSync: () => {
    try {
      isManuallyStopped = true;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }

      clearReconnectTimer();
      clearRealtimeChannel();
      reconnectAttempt = 0;

      set({ realtimeConnected: false });
    } catch (error) {
      console.error('stopRealtimeSync failed:', error);
    }
  },
});
