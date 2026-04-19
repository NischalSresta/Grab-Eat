import { apiClient } from './api.service';
import type { Order, CreateOrderRequest, OrderStatus } from '../types/menu.types';

export const orderService = {
  async placeOrder(data: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/orders', data);
  },

  async getOrderById(id: number): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  async getOrdersBySession(sessionToken: string): Promise<Order[]> {
    return apiClient.get<Order[]>(`/orders/session/${sessionToken}`);
  },

  async getOrdersByTable(tableId: number): Promise<Order[]> {
    return apiClient.get<Order[]>(`/orders/table/${tableId}`);
  },

  async getActiveOrders(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders/active');
  },

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return apiClient.get<Order[]>(`/orders/status/${status}`);
  },

  async getMyOrders(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders/my');
  },

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${id}/status`, { status });
  },

  async cancelOrder(id: number): Promise<void> {
    return apiClient.delete<void>(`/orders/${id}`);
  },
};
