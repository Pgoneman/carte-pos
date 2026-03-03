export interface Reservation {
    id: string;
    customerName: string;
    phoneNumber: string;
    reservationDate: string; // ISO string 2026-01-19T15:00:00.000Z
    guests: number;
    tableId: string | null;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
}
