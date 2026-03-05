// UI용 테이블 (Supabase row 매핑)
export interface Table {
    id: string;
    name: string;
    type: 'hall' | 'takeout' | 'delivery' | 'waiting';
    status: 'empty' | 'occupied' | 'reserved' | 'paid';
    guests?: number;
    startTime?: Date;
    totalAmount?: number;
}

export interface OrderItem {
    menuId: string;
    name: string;
    price: number;
    quantity: number;
    metadata?: Record<string, unknown>;
}

// 주문 상태 유니온 타입
export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled';

// 주방 현황용 (Supabase orders + order_items 매핑)
export interface KitchenOrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface KitchenOrder {
    id: string;
    tableId: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date;
    items: KitchenOrderItem[];
}

// 메뉴 (Supabase menus)
export interface Menu {
    id: string;
    name: string;
    nameKo?: string;
    categoryName: string;
    price: number;
    isAyce?: boolean;
    isAycePass?: boolean;
    description?: string;
    cal?: number;
    img?: string;
    popular?: boolean;
}

export * from './reservation';
