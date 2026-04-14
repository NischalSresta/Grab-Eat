import { apiClient } from './api.service';
import type {
  RestaurantTable,
  TableBooking,
  CreateBookingRequest,
  BookingStatus,
  TableFloor,
  TableStatus,
} from '../types/table.types';

export const tableService = {
  // Tables
  async getAllTables(): Promise<RestaurantTable[]> {
    return apiClient.get<RestaurantTable[]>('/tables');
  },

  async getTableById(id: number): Promise<RestaurantTable> {
    return apiClient.get<RestaurantTable>(`/tables/${id}`);
  },

  async getTablesByFloor(floor: TableFloor): Promise<RestaurantTable[]> {
    return apiClient.get<RestaurantTable[]>(`/tables/floor/${floor}`);
  },

  async getTableByQrToken(token: string): Promise<RestaurantTable> {
    return apiClient.get<RestaurantTable>(`/tables/qr/${token}`);
  },

  async createTable(tableNumber: string, capacity: number, floor: TableFloor): Promise<RestaurantTable> {
    return apiClient.post<RestaurantTable>('/tables', { tableNumber, capacity, floor });
  },

  async updateTable(id: number, tableNumber: string, capacity: number, floor: TableFloor): Promise<RestaurantTable> {
    return apiClient.put<RestaurantTable>(`/tables/${id}`, { tableNumber, capacity, floor });
  },

  async updateTableStatus(id: number, status: TableStatus): Promise<RestaurantTable> {
    return apiClient.patch<RestaurantTable>(`/tables/${id}/status`, { status });
  },

  async deleteTable(id: number): Promise<void> {
    return apiClient.delete<void>(`/tables/${id}`);
  },

  async regenerateQr(id: number): Promise<{ qrToken: string }> {
    return apiClient.post<{ qrToken: string }>(`/tables/${id}/regenerate-qr`);
  },

  // Bookings
  async createBooking(data: CreateBookingRequest): Promise<TableBooking> {
    return apiClient.post<TableBooking>('/bookings', data);
  },

  async getMyBookings(userId: number): Promise<TableBooking[]> {
    return apiClient.get<TableBooking[]>(`/bookings/user/${userId}`);
  },

  async cancelBooking(id: number): Promise<void> {
    return apiClient.patch<void>(`/bookings/${id}/cancel`);
  },

  async checkAvailability(tableId: number, date: string, startTime: string, endTime: string): Promise<boolean> {
    const res = await apiClient.get<{ available: boolean }>(
      `/bookings/availability?tableId=${tableId}&date=${date}&startTime=${startTime}&endTime=${endTime}`
    );
    return res.available;
  },

  // Admin
  async getAllBookings(): Promise<TableBooking[]> {
    return apiClient.get<TableBooking[]>('/bookings');
  },

  async getBookingsByDate(date: string): Promise<TableBooking[]> {
    return apiClient.get<TableBooking[]>(`/bookings/date/${date}`);
  },

  async updateBookingStatus(id: number, status: BookingStatus): Promise<TableBooking> {
    return apiClient.patch<TableBooking>(`/bookings/${id}/status`, { status });
  },
};
