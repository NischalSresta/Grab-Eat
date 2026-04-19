export type TableFloor = 'INDOOR' | 'OUTDOOR' | 'ROOFTOP' | 'PRIVATE_DINING' | 'TERRACE';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export const TABLE_FLOOR_LABELS: Record<TableFloor, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  ROOFTOP: 'Rooftop',
  PRIVATE_DINING: 'Private Dining',
  TERRACE: 'Terrace',
};

export const TABLE_FLOOR_ICONS: Record<TableFloor, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  ROOFTOP: 'Rooftop',
  PRIVATE_DINING: 'Private',
  TERRACE: 'Terrace',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export interface CreateTableRequest {
  tableNumber: string;
  capacity: number;
  floor: TableFloor;
  description?: string;
}

export interface UpdateTableRequest {
  tableNumber?: string;
  capacity?: number;
  floor?: TableFloor;
  status?: TableStatus;
  description?: string;
}

export interface TableItem {
  id: number;
  tableNumber: string;
  capacity: number;
  floor: TableFloor;
  status: TableStatus;
  description: string | null;
  assignedWaiter: string | null;
  isActive: boolean;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingItem {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  tableId: number;
  tableNumber: string;
  tableCapacity: number;
  tableFloor: TableFloor;
  tableQrToken: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: BookingStatus;
  specialRequests: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  tableId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  specialRequests?: string;
}

export interface AvailableTablesQuery {
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  floor?: TableFloor;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

// export const TABLE_FLOOR_LABELS = {
//   GROUND: 'Ground Floor',
//   FIRST: 'First Floor',
//   SECOND: 'Second Floor',
//   OUTDOOR: 'Outdoor',
// } as const;
