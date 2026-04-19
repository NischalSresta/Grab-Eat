import { apiService } from './api.service';
import { User } from '@/src/types';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/src/constants/config';

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class UserService {
  private unwrap<T>(response: any): T {
    return (response?.data ?? response) as T;
  }

  async getMyProfile(): Promise<User> {
    const response = await apiService.get<User>('/users/me');
    return this.unwrap<User>(response);
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    // Fetch current profile to preserve read-only fields required by backend UpdateUserRequest
    const current = await this.getMyProfile();
    const payload = {
      fullName: data.fullName,
      email: current.email,
      phoneNumber: data.phoneNumber ?? current.phoneNumber ?? null,
      role: current.role,
      isActive: current.isActive,
      isEmailVerified: current.isEmailVerified,
    };
    const response = await apiService.put<User>('/users/me', payload);
    const updated = this.unwrap<User>(response);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
    return updated;
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiService.post('/users/me/change-password', data);
  }
}

export const userService = new UserService();
