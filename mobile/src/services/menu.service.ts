import { apiService } from './api.service';
import { Category, MenuItem, TopPick } from '@/src/types';

class MenuService {
  private unwrap<T>(response: any): T {
    return (response?.data ?? response) as T;
  }

  async getCategories(): Promise<Category[]> {
    const response = await apiService.get<Category[]>('/menu/categories');
    return this.unwrap<Category[]>(response);
  }

  async getFullMenu(): Promise<MenuItem[]> {
    const response = await apiService.get<MenuItem[]>('/menu');
    return this.unwrap<MenuItem[]>(response);
  }

  async getItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    const response = await apiService.get<MenuItem[]>(`/menu/categories/${categoryId}/items`);
    return this.unwrap<MenuItem[]>(response);
  }

  async searchMenu(keyword: string): Promise<MenuItem[]> {
    const response = await apiService.get<MenuItem[]>(`/menu/search?q=${encodeURIComponent(keyword)}`);
    return this.unwrap<MenuItem[]>(response);
  }

  async getTopPicks(): Promise<TopPick[]> {
    try {
      const response = await apiService.get<TopPick[]>('/recommendations/top-picks');
      return this.unwrap<TopPick[]>(response);
    } catch {
      return [];
    }
  }
}

export const menuService = new MenuService();
