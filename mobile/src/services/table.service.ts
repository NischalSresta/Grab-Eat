import { apiService } from './api.service';
import {
  TableItem,
  BookingItem,
  CreateBookingRequest,
  TableFloor,
  PageResponse,
} from '@/src/types';

class TableService {
  private unwrap<T>(response: any): T {
    // Backend returns the data directly, not wrapped in ApiResponse
    return (response?.data ?? response) as T;
  }

  async getAllTables(): Promise<TableItem[]> {
    const response = await apiService.get<TableItem[]>('/tables');
    return this.unwrap<TableItem[]>(response);
  }

  async getTablesByFloor(floor: TableFloor): Promise<TableItem[]> {
    const response = await apiService.get<TableItem[]>(`/tables/floor/${floor}`);
    return this.unwrap<TableItem[]>(response);
  }

  async getAvailableTables(
    date: string,
    startTime: string,
    endTime: string,
    partySize: number,
    floor?: TableFloor
  ): Promise<TableItem[]> {
    const params = new URLSearchParams({
      date,
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      partySize: partySize.toString(),
    });
    const url = floor
      ? `/tables/available/floor/${floor}?${params}`
      : `/tables/available?${params}`;
    const response = await apiService.get<TableItem[]>(url);
    return this.unwrap<TableItem[]>(response);
  }

  async getMyBookings(page = 0, size = 10): Promise<PageResponse<BookingItem>> {
    const response = await apiService.get<PageResponse<BookingItem>>(
      `/bookings/my?page=${page}&size=${size}`
    );
    return this.unwrap<PageResponse<BookingItem>>(response);
  }

  async createBooking(data: CreateBookingRequest): Promise<BookingItem> {
    const response = await apiService.post<BookingItem>('/bookings', data);
    return this.unwrap<BookingItem>(response);
  }

  async cancelBooking(id: number): Promise<BookingItem> {
    const response = await apiService.patch<BookingItem>(`/bookings/${id}/cancel`, {});
    return this.unwrap<BookingItem>(response);
  }
}

export const tableService = new TableService();
