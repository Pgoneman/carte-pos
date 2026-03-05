import type { StateCreator } from 'zustand';
import type { PosStore, UiSlice } from './types';

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const createUiSlice: StateCreator<PosStore, [], [], UiSlice> = (set) => ({
  loading: false,
  toastMessage: null,
  realtimeRefreshTick: 0,
  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: message });
    toastTimer = setTimeout(() => {
      set({ toastMessage: null });
      toastTimer = null;
    }, 2500);
  },
});
