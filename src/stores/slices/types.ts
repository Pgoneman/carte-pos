import type { KitchenOrder, Menu, OrderItem, Reservation, Table } from '../../types';

export interface UiSlice {
  loading: boolean;
  toastMessage: string | null;
  showToast: (message: string) => void;
}

export interface TableSlice {
  tables: Table[];
  selectedTableId: string | null;
  fetchTables: () => Promise<void>;
  selectTable: (id: string | null) => void;
  setTableOccupied: (id: string, guests: number) => Promise<void>;
  clearTable: (id: string) => Promise<void>;
}

export interface MenuSlice {
  menus: Record<string, Menu[]>;
  categories: string[];
  selectedCategory: string | null;
  fetchMenus: () => Promise<void>;
  selectCategory: (category: string | null) => void;
}

export interface OrderSlice {
  currentOrder: OrderItem[];
  addToOrder: (item: Omit<OrderItem, 'quantity'>) => void;
  removeFromOrder: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearOrder: () => void;
  submitOrder: () => Promise<void>;
  fetchTableOrders: (tableId: string) => Promise<void>;
  processPayment: (method: string) => Promise<void>;
}

export interface KitchenSlice {
  kitchenOrders: KitchenOrder[];
  fetchKitchenOrders: () => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  completeAllOrders: () => Promise<void>;
  setOrderReady: (orderId: string) => Promise<void>;
  setOrderServed: (orderId: string) => Promise<void>;
  revertOrderStatus: (orderId: string, toStatus?: string) => Promise<void>;
}

export interface SyncSlice {
  realtimeConnected: boolean;
  startRealtimeSync: () => void;
  stopRealtimeSync: () => void;
}

export interface ReservationSlice {
  reservations: Reservation[];
  isReservationModalOpen: boolean;
  openReservationModal: () => void;
  closeReservationModal: () => void;
  fetchReservations: () => Promise<void>;
  createReservation: (
    reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>
  ) => Promise<boolean>;
}

export type PosStore = UiSlice &
  TableSlice &
  MenuSlice &
  OrderSlice &
  KitchenSlice &
  SyncSlice &
  ReservationSlice;
