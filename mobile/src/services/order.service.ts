import { apiService } from './api.service';
import { Order } from '@/src/types';

export interface PlaceOrderRequest {
  tableQrToken: string;
  sessionToken?: string;
  customerName?: string;
  notes?: string;
  items: { menuItemId: number; quantity: number; specialInstructions?: string }[];
}

class OrderService {
  private unwrap<T>(response: any): T {
    return (response?.data ?? response) as T;
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await apiService.get<Order[]>('/orders/my');
    return this.unwrap<Order[]>(response);
  }

  async getOrderById(id: number): Promise<Order> {
    const response = await apiService.get<Order>(`/orders/${id}`);
    return this.unwrap<Order>(response);
  }

  async placeOrder(request: PlaceOrderRequest): Promise<Order> {
    const response = await apiService.post<Order>('/orders', request);
    return this.unwrap<Order>(response);
  }
}

export const orderService = new OrderService();
