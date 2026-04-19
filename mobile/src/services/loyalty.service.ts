import { apiService } from './api.service';
import { LoyaltyAccount, LoyaltyTransaction, Reward } from '@/src/types';

class LoyaltyService {
  private unwrap<T>(response: any): T {
    return (response?.data ?? response) as T;
  }

  async getMyAccount(): Promise<LoyaltyAccount> {
    const response = await apiService.get<LoyaltyAccount>('/loyalty/me');
    return this.unwrap<LoyaltyAccount>(response);
  }

  async getMyHistory(): Promise<LoyaltyTransaction[]> {
    const response = await apiService.get<LoyaltyTransaction[]>('/loyalty/me/history');
    return this.unwrap<LoyaltyTransaction[]>(response);
  }

  async getAvailableRewards(): Promise<Reward[]> {
    const response = await apiService.get<Reward[]>('/loyalty/rewards');
    return this.unwrap<Reward[]>(response);
  }

  async redeemReward(rewardId: number): Promise<LoyaltyAccount> {
    const response = await apiService.post<LoyaltyAccount>(`/loyalty/redeem/${rewardId}`);
    return this.unwrap<LoyaltyAccount>(response);
  }
}

export const loyaltyService = new LoyaltyService();
