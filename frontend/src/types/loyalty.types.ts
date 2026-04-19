export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD';
export type LoyaltyTransactionType = 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED';

export interface LoyaltyAccount {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
}

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTransactionType;
  pointsChange: number;
  balanceAfter: number;
  orderId?: number;
  description: string;
  createdAt: string;
}

export interface Reward {
  id: number;
  name: string;
  description?: string;
  pointsCost: number;
  discountAmount: number;
  isActive: boolean;
}

export interface CreateRewardRequest {
  name: string;
  description?: string;
  pointsCost: number;
  discountAmount: number;
}
