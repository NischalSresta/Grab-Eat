import * as SecureStore from 'expo-secure-store';
import { apiService } from './api.service';
import { STORAGE_KEYS } from '@/src/constants/config';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User 
} from '@/src/types';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);

    const authData = response.data || response as any;
    await this.storeAuthData(authData);
    
    return authData;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    const authData = response.data || response as any;
    
    return authData;
  }

  async logout(): Promise<void> {
    try {
      // Send access token to backend for blacklisting
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        await apiService.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all tokens from device (access token is blacklisted on backend)
      await this.clearAuthData();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userDataString = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      if (userDataString) {
        return JSON.parse(userDataString);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  private async storeAuthData(authData: AuthResponse): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user));
  }

  private async clearAuthData(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  }

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.post('/auth/verify-email', { email, code });
    return response.data || response as any;
  }

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.post('/auth/resend-verification', { email });
    return response.data || response as any;
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.post('/auth/forgot-password', { email });
    return response.data || response as any;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.post(`/auth/reset-password?email=${encodeURIComponent(email)}`, { code, newPassword });
    return response.data || response as any;
  }
}

export const authService = new AuthService();
