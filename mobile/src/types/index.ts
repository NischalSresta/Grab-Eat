export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  OWNER = 'OWNER',
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
}

// ── Table Management ──────────────────────────────────────────────────────────

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
  INDOOR: '🏠',
  OUTDOOR: '🌿',
  ROOFTOP: '🌆',
  PRIVATE_DINING: '🥂',
  TERRACE: '☀️',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: '#d97706',
  CONFIRMED: '#16a34a',
  CANCELLED: '#dc2626',
  COMPLETED: '#2563eb',
};

export const BOOKING_STATUS_BG: Record<BookingStatus, string> = {
  PENDING: '#fef3c7',
  CONFIRMED: '#dcfce7',
  CANCELLED: '#fee2e2',
  COMPLETED: '#dbeafe',
};

export interface TableItem {
  id: number;
  tableNumber: string;
  capacity: number;
  floor: TableFloor;
  status: TableStatus;
  description: string | null;
  isActive: boolean;
}

export interface BookingItem {
  id: number;
  userId: number;
  userFullName: string;
  tableId: number;
  tableNumber: string;
  tableCapacity: number;
  tableFloor: TableFloor;
  bookingDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: BookingStatus;
  specialRequests: string | null;
  createdAt: string;
}

export interface CreateBookingRequest {
  tableId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  specialRequests?: string;
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

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  categoryName?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  allergens?: string;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string;
}

export interface Order {
  id: number;
  tableNumber: string;
  customerName?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
}

// ── Loyalty ───────────────────────────────────────────────────────────────────

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD';
export type LoyaltyTransactionType = 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED';

export interface LoyaltyAccount {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
}

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTransactionType;
  pointsChange: number;
  balanceAfter: number;
  orderId?: number;
  description: string;
  createdAt: string;
}

export interface Reward {
  id: number;
  name: string;
  description?: string;
  pointsCost: number;
  discountAmount: number;
  isActive: boolean;
}

// ── Recommendations ───────────────────────────────────────────────────────────

export interface TopPick {
  id: number;
  menuItemId: number;
  menuItemName: string;
  menuItemDescription?: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  rank: number;
  totalOrdered: number;
  weekStart: string;
}
