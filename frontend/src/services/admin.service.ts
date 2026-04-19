import { apiClient } from './api.service';
import type {
  PageResponse,
  StaffMember,
  UpdateStaffRequest,
  PaginationParams,
} from '../types/admin.types';
import type { Role } from '../types/auth.types';

export const adminService = {
  async getAllStaff(params?: PaginationParams): Promise<PageResponse<StaffMember>> {
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);

    const url = `/admin/staff${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<PageResponse<StaffMember>>(url);
  },

  async getStaffByRole(role: Role, params?: PaginationParams): Promise<PageResponse<StaffMember>> {
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);

    const url = `/admin/staff/role/${role}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<PageResponse<StaffMember>>(url);
  },

  async getStaffById(id: number): Promise<StaffMember> {
    return apiClient.get<StaffMember>(`/admin/staff/${id}`);
  },

  async updateStaff(id: number, data: UpdateStaffRequest): Promise<StaffMember> {
    return apiClient.put<StaffMember>(`/admin/staff/${id}`, data);
  },

  async deleteStaff(id: number): Promise<void> {
    return apiClient.delete<void>(`/admin/staff/${id}`);
  },

  async getDashboardStats(): Promise<{
    totalStaff: number;
    totalCustomers: number;
    activeOrders: number;
    totalOrdersToday: number;
    totalMenuItems: number;
    revenueToday: number;
    revenueThisMonth: number;
    lowStockAlerts: number;
  }> {
    return apiClient.get('/admin/stats');
  },
};
