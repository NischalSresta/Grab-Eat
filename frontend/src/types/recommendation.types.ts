export interface TopPick {
  id: number;
  menuItemId: number;
  menuItemName: string;
  menuItemDescription?: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  categoryType?: 'FOOD' | 'BEVERAGE';
  rank: number;
  totalOrdered: number;
  score: number;
  weekStart: string;
}
