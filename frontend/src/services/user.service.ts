import { apiClient } from './api.service';

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string; // ISO date: YYYY-MM-DD
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userService = {
  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<void> {
    return apiClient.put<void>('/users/me', data);
  },

  /**
   * Change current user's password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.post<void>('/users/me/change-password', data);
  },
};
