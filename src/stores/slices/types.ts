import type { KitchenOrder, Menu, OrderItem, OrderStatus, Reservation, Table } from '../../types';

export interface UiSlice {
  loading: boolean;
  toastMessage: string | null;
  realtimeRefreshTick: number;
  showToast: (message: string) => void;
}

export interface TableSlice {
  tables: Table[];
  selectedTableId: string | null;
  todaySales: number;
  fetchTables: () => Promise<void>;
  selectTable: (id: string | null) => void;
  setTableOccupied: (id: string, guests: number) => Promise<void>;
  clearTable: (id: string) => Promise<void>;
  fetchTodaySales: () => Promise<void>;
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
  serverOrders: OrderItem[];
  addToOrder: (item: Omit<OrderItem, 'quantity'>) => void;
  removeFromOrder: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearOrder: () => void;
  submitOrder: () => Promise<void>;
  fetchTableOrders: (tableId: string) => Promise<void>;
  processPayment: (method: string) => Promise<boolean>;
  processCustomerPayment: (method: string) => Promise<boolean>;
}

export interface KitchenSlice {
  kitchenOrders: KitchenOrder[];
  completedItemIds: string[];
  fetchKitchenOrders: () => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  completeAllOrders: () => Promise<void>;
  setOrderReady: (orderId: string) => Promise<void>;
  setOrderServed: (orderId: string) => Promise<void>;
  revertOrderStatus: (orderId: string, toStatus?: OrderStatus) => Promise<void>;
  markItemCompleted: (orderId: string, itemId: string) => void;
  markItemUncompleted: (itemId: string) => void;
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
