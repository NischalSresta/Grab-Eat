export type TableFloor = 'GROUND' | 'FIRST' | 'SECOND' | 'ROOFTOP';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface RestaurantTable {
  id: number;
  tableNumber: string;
  floor: TableFloor;
  capacity: number;
  status: TableStatus;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableBooking {
  id: number;
  table: RestaurantTable;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  tableId: number;
  userId?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  specialRequests?: string;
}

export interface AvailabilityCheckParams {
  tableId: number;
  date: string;
  startTime: string;
  endTime: string;
}
