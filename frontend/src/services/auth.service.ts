import Cookies from 'js-cookie';
import { apiClient } from './api.service';
import type { LoginRequest, RegisterRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest } from '../types/auth.types';

const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD, // Only use secure cookies in production
  sameSite: 'strict' as const,
  expires: 7, // 7 days
};

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', userData);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  },

  async logout(): Promise<void> {
    // Send access token to backend for blacklisting
    const accessToken = this.getAccessToken();
    if (accessToken) {
      await apiClient.post(
        '/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }
  },

  // Cookie-based storage helpers
  // Stores tokens with proper expiry times. Refresh tokens are rotated on each refresh.
  setTokens(accessToken: string, refreshToken: string): void {
    Cookies.set('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      expires: 1 / 24, // 1 hour for access token
    });
    Cookies.set('refreshToken', refreshToken, COOKIE_OPTIONS); // 7 days for refresh token
  },

  getAccessToken(): string | null {
    return Cookies.get('accessToken') || null;
  },

  getRefreshToken(): string | null {
    return Cookies.get('refreshToken') || null;
  },

  clearTokens(): void {
    // Clear all client-side tokens (access token is blacklisted on backend)
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('user');
  },

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/auth/verify-email', { email, code });
  },

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/auth/resend-verification', { email });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/auth/reset-password?email=${encodeURIComponent(email)}`, {
      code,
      newPassword,
    });
  },
};
