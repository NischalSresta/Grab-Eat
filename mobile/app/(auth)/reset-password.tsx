import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/src/services/auth.service';
import { AuthCard } from '@/src/components/auth/AuthCard';
import { Alert } from '@/src/components/auth/Alert';
import { OTPInput } from '@/src/components/auth/OTPInput';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/forgot-password');
    }
  }, [email]);

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      await authService.resetPassword(email!, otp, newPassword);
      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset Password"
      description={`Enter the code sent to ${email}`}
      footer={
        <Text className="text-sm text-white/90">
          Wrong email?{' '}
          <Link href="/(auth)/forgot-password" className="font-semibold underline">
            Change email
          </Link>
        </Text>
      }
    >
      <View className="gap-5">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        <View className="gap-3">
          <Text className="text-sm font-medium text-gray-700 text-center">Verification Code</Text>
          <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
          <Text className="text-xs text-gray-600 text-center">Enter the 6-digit code from your email</Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">New Password</Text>
          <View className="flex-row items-center border border-gray-300 rounded-lg px-3 bg-white">
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 h-12 text-sm text-gray-900 ml-2"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">Confirm Password</Text>
          <View className="flex-row items-center border border-gray-300 rounded-lg px-3 bg-white">
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 h-12 text-sm text-gray-900 ml-2"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className={`bg-purple-600 py-3.5 rounded-lg items-center shadow-lg ${(isLoading || otp.length !== 6) ? 'opacity-50' : ''}`}
          onPress={handleSubmit}
          disabled={isLoading || otp.length !== 6}
          style={{
            shadowColor: '#667eea',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-white text-base font-semibold">
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthCard>
  );
}
