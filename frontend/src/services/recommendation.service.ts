import { apiClient } from './api.service';
import type { TopPick } from '../types/recommendation.types';

export const recommendationService = {
  async getTopPicks(): Promise<TopPick[]> {
    return apiClient.get<TopPick[]>('/recommendations/top-picks');
  },

  async computeTopPicks(): Promise<void> {
    return apiClient.post<void>('/recommendations/top-picks/compute');
  },
};
