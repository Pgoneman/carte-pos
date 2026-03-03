// UI용 테이블 (Supabase row 매핑)
export interface Table {
    id: string;
    name: string;
    type: 'hall' | 'takeout' | 'delivery' | 'waiting';
    status: 'empty' | 'occupied' | 'reserved';
    guests?: number;
    startTime?: Date;
    totalAmount?: number;
    orders?: { id: string; items: { name: string; quantity: number }[] }[];
}

export interface OrderItem {
    menuId: string;
    name: string;
    price: number;
    quantity: number;
}

// 주방 현황용 (Supabase orders + order_items 매핑)
export interface KitchenOrder {
    id: string;
    tableId: string;
    status: string;
    total_amount: number;
    createdAt: Date;
    items: { name: string; price: number; quantity: number }[];
}

// 메뉴 (Supabase menus)
export interface Menu {
    id: string;
    name: string;
    category_name: string;
    price: number;
}

export * from './reservation';
