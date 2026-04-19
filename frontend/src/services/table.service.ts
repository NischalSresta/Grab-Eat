import axios from 'axios';
import Cookies from 'js-cookie';
import { apiClient } from './api.service';
import type {
  TableItem,
  BookingItem,
  CreateBookingRequest,
  CreateTableRequest,
  UpdateTableRequest,
  AvailableTablesQuery,
  TableFloor,
  PageResponse,
} from '../types/table.types';

export interface TableBookingDetails {
  bookingId: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  specialRequests?: string;
}

export const tableService = {
  async getAllTables(): Promise<TableItem[]> {
    return apiClient.get<TableItem[]>('/tables');
  },

  async getTablesByFloor(floor: TableFloor): Promise<TableItem[]> {
    return apiClient.get<TableItem[]>(`/tables/floor/${floor}`);
  },

  async getAvailableTables(query: AvailableTablesQuery): Promise<TableItem[]> {
    const params = new URLSearchParams({
      date: query.date,
      startTime: query.startTime,
      endTime: query.endTime,
      partySize: query.partySize.toString(),
    });
    const url = query.floor
      ? `/tables/available/floor/${query.floor}?${params}`
      : `/tables/available?${params}`;
    return apiClient.get<TableItem[]>(url);
  },

  async getTableById(id: number): Promise<TableItem> {
    return apiClient.get<TableItem>(`/tables/${id}`);
  },

  async getMyBookings(page = 0, size = 10): Promise<PageResponse<BookingItem>> {
    return apiClient.get<PageResponse<BookingItem>>(`/bookings/my?page=${page}&size=${size}`);
  },

  async getBookingById(id: number): Promise<BookingItem> {
    return apiClient.get<BookingItem>(`/bookings/${id}`);
  },

  async createBooking(data: CreateBookingRequest): Promise<BookingItem> {
    return apiClient.post<BookingItem>('/bookings', data);
  },

  async cancelBooking(id: number): Promise<BookingItem> {
    return apiClient.patch<BookingItem>(`/bookings/${id}/cancel`, {});
  },

  // Admin / Owner operations

  async adminCreateTable(data: CreateTableRequest): Promise<TableItem> {
    return apiClient.post<TableItem>('/tables', data);
  },

  async adminUpdateTable(id: number, data: UpdateTableRequest): Promise<TableItem> {
    return apiClient.put<TableItem>(`/tables/${id}`, data);
  },

  async adminDeleteTable(id: number): Promise<void> {
    return apiClient.delete<void>(`/tables/${id}`);
  },

  async adminGetAllBookings(page = 0, size = 20): Promise<PageResponse<BookingItem>> {
    return apiClient.get<PageResponse<BookingItem>>(`/bookings?page=${page}&size=${size}`);
  },

  async adminGetBookingsByTable(tableId: number): Promise<BookingItem[]> {
    return apiClient.get<BookingItem[]>(`/bookings/table/${tableId}`);
  },

  async adminGetActiveBookings(): Promise<BookingItem[]> {
    return apiClient.get<BookingItem[]>('/bookings/active');
  },

  async adminConfirmBooking(id: number): Promise<BookingItem> {
    return apiClient.patch<BookingItem>(`/bookings/${id}/confirm`, {});
  },

  async adminCompleteBooking(id: number): Promise<BookingItem> {
    return apiClient.patch<BookingItem>(`/bookings/${id}/complete`, {});
  },

  async adminCancelBooking(id: number): Promise<BookingItem> {
    return apiClient.patch<BookingItem>(`/bookings/${id}/admin-cancel`, {});
  },

  async getTableQrCodeBlobUrl(tableId: number): Promise<string> {
    const token = Cookies.get('accessToken') ?? '';
    const response = await axios.get(`http://localhost:8081/api/v1/qr/table/${tableId}`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
    });
    return URL.createObjectURL(response.data);
  },

  async getTableBookingDetails(tableId: number): Promise<BookingItem | null> {
    try {
      const bookings = await apiClient.get<BookingItem[]>(`/bookings/table/${tableId}`);
      const active = bookings.find(
        (b: BookingItem) => b.status === 'PENDING' || b.status === 'CONFIRMED'
      );
      return active ?? null;
    } catch {
      return null;
    }
  },
};
