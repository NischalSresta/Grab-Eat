export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  categoryName: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  sortOrder: number;
  allergens?: string;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface MenuItemRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  sortOrder?: number;
  allergens?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  specialInstructions?: string;
}

export interface CreateOrderRequest {
  tableQrToken: string;
  customerName?: string;
  sessionToken?: string;
  items: OrderItemRequest[];
  notes?: string;
  userId?: number;
}

export interface OrderItemResponse {
  id: number;
  menuItemId: number;
  menuItemName: string;
  menuItemImageUrl?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string;
}

export interface Order {
  id: number;
  tableId: number;
  tableNumber: string;
  sessionToken: string;
  customerName?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  notes?: string;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
  cashRequested?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface TableInfo {
  tableId: number;
  tableNumber: string;
  floor: string;
  capacity: number;
  status: string;
}
