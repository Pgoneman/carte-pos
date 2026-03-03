import type { StateCreator } from 'zustand';
import type { PosStore, UiSlice } from './types';

export const createUiSlice: StateCreator<PosStore, [], [], UiSlice> = (set) => ({
  loading: false,
  toastMessage: null,
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => set({ toastMessage: null }), 2500);
  },
});
