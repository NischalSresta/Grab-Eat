export type InventoryLogType = 'ORDER_DEDUCTION' | 'MANUAL_ADJUSTMENT' | 'WASTAGE' | 'RESTOCK';

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  costPerUnit: number;
  description?: string;
  isActive: boolean;
  isLowStock: boolean;
}

export interface CreateIngredientRequest {
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  costPerUnit: number;
  description?: string;
}

export interface AdjustStockRequest {
  quantityChange: number;
  type: InventoryLogType;
  notes?: string;
}

export interface RecipeIngredient {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  quantityUsed: number;
}

export interface RecipeIngredientRequest {
  ingredientId: number;
  quantityUsed: number;
}

export interface InventoryLog {
  id: number;
  ingredientId: number;
  ingredientName: string;
  type: InventoryLogType;
  quantityChange: number;
  stockAfter: number;
  orderId?: number;
  performedBy?: string;
  description?: string;
  createdAt: string;
}
