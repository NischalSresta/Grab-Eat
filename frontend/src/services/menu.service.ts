import { apiClient } from './api.service';
import type {
  Category,
  MenuItem,
  CategoryRequest,
  MenuItemRequest,
  TableInfo,
} from '../types/menu.types';

export const menuService = {
  // Public (no auth required)

  async getFullMenu(): Promise<MenuItem[]> {
    return apiClient.get<MenuItem[]>('/menu');
  },

  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/menu/categories');
  },

  async getItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return apiClient.get<MenuItem[]>(`/menu/categories/${categoryId}/items`);
  },

  async getMenuItemById(id: number): Promise<MenuItem> {
    return apiClient.get<MenuItem>(`/menu/items/${id}`);
  },

  async searchMenu(keyword: string): Promise<MenuItem[]> {
    return apiClient.get<MenuItem[]>(`/menu/search?keyword=${encodeURIComponent(keyword)}`);
  },

  async resolveQrToken(qrToken: string): Promise<TableInfo> {
    return apiClient.get<TableInfo>(`/qr/resolve/${qrToken}`);
  },

  // Admin / Owner operations (auth required)

  async createCategory(data: CategoryRequest): Promise<Category> {
    return apiClient.post<Category>('/menu/categories', data);
  },

  async updateCategory(id: number, data: CategoryRequest): Promise<Category> {
    return apiClient.put<Category>(`/menu/categories/${id}`, data);
  },

  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`/menu/categories/${id}`);
  },

  async createMenuItem(data: MenuItemRequest): Promise<MenuItem> {
    return apiClient.post<MenuItem>('/menu/items', data);
  },

  async updateMenuItem(id: number, data: MenuItemRequest): Promise<MenuItem> {
    return apiClient.put<MenuItem>(`/menu/items/${id}`, data);
  },

  async deleteMenuItem(id: number): Promise<void> {
    return apiClient.delete<void>(`/menu/items/${id}`);
  },

  getQrCodeUrl(tableId: number): string {
    return `http://localhost:8081/api/v1/qr/table/${tableId}`;
  },
};
