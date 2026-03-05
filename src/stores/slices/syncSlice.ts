import type { RealtimeChannel } from '@supabase/supabase-js';
import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { PosStore, SyncSlice } from './types';

// HMR-safe: globalThis에 저장하여 모듈 재평가 시에도 상태 유지
type SyncModuleState = {
  realtimeChannel: RealtimeChannel | null;
  refreshTimer: ReturnType<typeof setTimeout> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempt: number;
  isManuallyStopped: boolean;
  lastLocalSubmitTs: number;
};

const SYNC_STATE_KEY = '__carte_sync_state__';
const _g = globalThis as unknown as Record<string, SyncModuleState | undefined>;
if (!_g[SYNC_STATE_KEY]) {
  _g[SYNC_STATE_KEY] = {
    realtimeChannel: null,
    refreshTimer: null,
    reconnectTimer: null,
    reconnectAttempt: 0,
    isManuallyStopped: false,
    lastLocalSubmitTs: 0,
  };
}
const syncState = _g[SYNC_STATE_KEY]!;

/** 주문 제출 직후 호출 — queueRefresh가 currentOrder를 재채우지 않도록 보호 */
export function markLocalSubmit() {
  syncState.lastLocalSubmitTs = Date.now();
}

const REFRESH_DEBOUNCE_MS = 200;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

function queueRefresh(get: () => PosStore, set: (partial: Partial<PosStore>) => void) {
  if (syncState.refreshTimer) clearTimeout(syncState.refreshTimer);

  syncState.refreshTimer = setTimeout(async () => {
    // 결제 완료 감지를 위해 before 스냅샷 저장
    const tablesBefore = get().tables;

    await get().fetchTables();
    void get().fetchKitchenOrders();

    // before/after 비교 — 새로 'paid'가 된 테이블 감지
    const tablesAfter = get().tables;
    tablesAfter.forEach((after) => {
      if (after.status === 'paid') {
        const before = tablesBefore.find((b) => b.id === after.id);
        if (before && before.status !== 'paid') {
          get().showToast(`${after.name} 테이블 결제 완료! 퇴점 준비`);
        }
      }
    });

    const selectedTableId = get().selectedTableId;
    // 로컬 주문 직후 2초간은 fetchTableOrders 스킵 (중복 주문 방지)
    if (selectedTableId && Date.now() - syncState.lastLocalSubmitTs > 2000) {
      void get().fetchTableOrders(selectedTableId);
    }

    // 고객 페이지 등 외부 컴포넌트에 리프레시 시그널
    set({ realtimeRefreshTick: get().realtimeRefreshTick + 1 });
  }, REFRESH_DEBOUNCE_MS);
}

function clearRealtimeChannel() {
  if (!syncState.realtimeChannel) return;
  void supabase.removeChannel(syncState.realtimeChannel);
  syncState.realtimeChannel = null;
}

function clearReconnectTimer() {
  if (!syncState.reconnectTimer) return;
  clearTimeout(syncState.reconnectTimer);
  syncState.reconnectTimer = null;
}

export const createSyncSlice: StateCreator<PosStore, [], [], SyncSlice> = (set, get) => ({
  realtimeConnected: false,

  startRealtimeSync: () => {
    try {
      syncState.isManuallyStopped = false;
      if (syncState.realtimeChannel) return;

      syncState.realtimeChannel = supabase
        .channel('pos-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => queueRefresh(get, set)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tables' },
          () => queueRefresh(get, set)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menus' },
          () => void get().fetchMenus()
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // 재연결 성공 시에만 토스트 (최초 연결은 조용히)
            if (syncState.reconnectAttempt > 0) {
              get().showToast('실시간 동기화가 재연결되었습니다.');
            }
            set({ realtimeConnected: true });
            syncState.reconnectAttempt = 0;
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
            if (syncState.isManuallyStopped) return;

            const delay = Math.min(
              RECONNECT_BASE_MS * 2 ** syncState.reconnectAttempt,
              RECONNECT_MAX_MS
            );
            syncState.reconnectAttempt += 1;

            clearReconnectTimer();
            syncState.reconnectTimer = setTimeout(() => {
              syncState.reconnectTimer = null;
              if (syncState.isManuallyStopped) return;
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
      syncState.isManuallyStopped = true;

      if (syncState.refreshTimer) {
        clearTimeout(syncState.refreshTimer);
        syncState.refreshTimer = null;
      }

      clearReconnectTimer();
      clearRealtimeChannel();
      syncState.reconnectAttempt = 0;

      set({ realtimeConnected: false });
    } catch (error) {
      console.error('stopRealtimeSync failed:', error);
    }
  },
});
