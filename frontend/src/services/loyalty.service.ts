import { apiClient } from './api.service';
import type { LoyaltyAccount, LoyaltyTransaction, Reward, CreateRewardRequest } from '../types/loyalty.types';

export const loyaltyService = {
  async getMyAccount(): Promise<LoyaltyAccount> {
    return apiClient.get<LoyaltyAccount>('/loyalty/me');
  },

  async getMyHistory(): Promise<LoyaltyTransaction[]> {
    return apiClient.get<LoyaltyTransaction[]>('/loyalty/me/history');
  },

  async redeemReward(rewardId: number): Promise<LoyaltyAccount> {
    return apiClient.post<LoyaltyAccount>(`/loyalty/redeem/${rewardId}`);
  },

  async getAvailableRewards(): Promise<Reward[]> {
    return apiClient.get<Reward[]>('/loyalty/rewards');
  },

  async createReward(data: CreateRewardRequest): Promise<Reward> {
    return apiClient.post<Reward>('/loyalty/rewards', data);
  },

  async deleteReward(id: number): Promise<void> {
    return apiClient.delete<void>(`/loyalty/rewards/${id}`);
  },
};
