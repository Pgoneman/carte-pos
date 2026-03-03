import { create } from 'zustand';
import { createKitchenSlice } from './slices/kitchenSlice';
import { createMenuSlice } from './slices/menuSlice';
import { createOrderSlice } from './slices/orderSlice';
import { createSyncSlice } from './slices/syncSlice';
import { createTableSlice } from './slices/tableSlice';
import { createReservationSlice } from './slices/reservationSlice';
import type { PosStore } from './slices/types';
import { createUiSlice } from './slices/uiSlice';

export const usePosStore = create<PosStore>()((...args) => ({
  ...createUiSlice(...args),
  ...createTableSlice(...args),
  ...createMenuSlice(...args),
  ...createOrderSlice(...args),
  ...createKitchenSlice(...args),
  ...createSyncSlice(...args),
  ...createReservationSlice(...args),
}));

export type { PosStore } from './slices/types';
export type { KitchenOrder, Menu, OrderItem, Table } from '../types';
