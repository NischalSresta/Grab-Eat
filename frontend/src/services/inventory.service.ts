import { apiClient } from './api.service';
import type {
  Ingredient,
  CreateIngredientRequest,
  AdjustStockRequest,
  RecipeIngredient,
  RecipeIngredientRequest,
  InventoryLog,
} from '../types/inventory.types';

export const inventoryService = {
  async getAllIngredients(): Promise<Ingredient[]> {
    return apiClient.get<Ingredient[]>('/inventory');
  },

  async getLowStockIngredients(): Promise<Ingredient[]> {
    return apiClient.get<Ingredient[]>('/inventory/low-stock');
  },

  async createIngredient(data: CreateIngredientRequest): Promise<Ingredient> {
    return apiClient.post<Ingredient>('/inventory', data);
  },

  async updateIngredient(id: number, data: CreateIngredientRequest): Promise<Ingredient> {
    return apiClient.put<Ingredient>(`/inventory/${id}`, data);
  },

  async adjustStock(id: number, data: AdjustStockRequest): Promise<Ingredient> {
    return apiClient.post<Ingredient>(`/inventory/${id}/adjust`, data);
  },

  async deleteIngredient(id: number): Promise<void> {
    return apiClient.delete<void>(`/inventory/${id}`);
  },

  async getRecipe(menuItemId: number): Promise<RecipeIngredient[]> {
    return apiClient.get<RecipeIngredient[]>(`/inventory/recipe/${menuItemId}`);
  },

  async addRecipeIngredient(menuItemId: number, data: RecipeIngredientRequest): Promise<RecipeIngredient> {
    return apiClient.post<RecipeIngredient>(`/inventory/recipe/${menuItemId}`, data);
  },

  async removeRecipeIngredient(menuItemId: number, ingredientId: number): Promise<void> {
    return apiClient.delete<void>(`/inventory/recipe/${menuItemId}/ingredient/${ingredientId}`);
  },

  async getLogs(page = 0, size = 20): Promise<{ content: InventoryLog[]; totalElements: number }> {
    return apiClient.get(`/inventory/logs?page=${page}&size=${size}`);
  },

  async getIngredientLogs(id: number, page = 0, size = 20): Promise<{ content: InventoryLog[]; totalElements: number }> {
    return apiClient.get(`/inventory/${id}/logs?page=${page}&size=${size}`);
  },
};
