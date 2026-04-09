export type PaymentMethod = 'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'KHALTI';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface BillItem {
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string;
}

export interface BillResponse {
  orderId: number;
  tableNumber: string;
  items: BillItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
}

export interface ProcessPaymentRequest {
  paymentMethod: PaymentMethod;
  loyaltyRewardId?: number;
}

export interface SplitBillRequest {
  numberOfPeople: number;
}

export interface SplitBillResponse {
  orderId: number;
  totalAmount: number;
  numberOfPeople: number;
  amountPerPerson: number;
}

export interface KhaltiInitiateResponse {
  pidx: string;
  paymentUrl: string;
  expiresAt: string;
  expiresIn: number;
}

export interface KhaltiVerifyRequest {
  pidx: string;
}
