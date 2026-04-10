import { apiClient } from './api.service';
import type {
  BillResponse,
  ProcessPaymentRequest,
  SplitBillRequest,
  SplitBillResponse,
  KhaltiInitiateResponse,
  KhaltiVerifyRequest,
} from '../types/billing.types';

export const billingService = {
  async getBill(orderId: number): Promise<BillResponse> {
    return apiClient.get<BillResponse>(`/billing/${orderId}`);
  },

  async processPayment(orderId: number, data: ProcessPaymentRequest): Promise<BillResponse> {
    return apiClient.post<BillResponse>(`/billing/${orderId}/pay`, data);
  },

  async splitBill(orderId: number, data: SplitBillRequest): Promise<SplitBillResponse> {
    return apiClient.post<SplitBillResponse>(`/billing/${orderId}/split`, data);
  },

  async initiateKhaltiPayment(orderId: number, returnUrl?: string): Promise<KhaltiInitiateResponse> {
    const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    return apiClient.post<KhaltiInitiateResponse>(`/billing/${orderId}/khalti/initiate${params}`);
  },

  /** Public — called by customer directly from order tracker (no staff auth needed) */
  async customerInitiateKhaltiPayment(orderId: number): Promise<KhaltiInitiateResponse> {
    return apiClient.post<KhaltiInitiateResponse>(`/billing/${orderId}/khalti/pay`);
  },

  async verifyKhaltiPayment(data: KhaltiVerifyRequest): Promise<BillResponse> {
    return apiClient.post<BillResponse>('/billing/khalti/verify', data);
  },

  /** Public — customer signals they want to pay with cash; staff must confirm */
  async requestCashPayment(orderId: number): Promise<void> {
    return apiClient.post<void>(`/billing/${orderId}/cash/request`);
  },

  /** Staff only — confirms cash was received, marks PAID, awards loyalty points */
  async confirmCashPayment(orderId: number): Promise<BillResponse> {
    return apiClient.post<BillResponse>(`/billing/${orderId}/cash/confirm`);
  },
};
