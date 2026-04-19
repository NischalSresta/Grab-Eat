import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/src/services/auth.service';
import { AuthCard } from '@/src/components/auth/AuthCard';
import { Alert } from '@/src/components/auth/Alert';

export default function RequestVerificationScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.resendVerification(email);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Email Verification"
      description="Enter your email to receive a verification code"
      footer={
        <Text className="text-sm text-white/90">
          Already verified?{' '}
          <Link href="/(auth)/login" className="font-semibold underline">
            Sign in
          </Link>
        </Text>
      }
    >
      <View className="gap-5">
        {error && <Alert type="error" message={error} />}

        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">Email Address</Text>
          <View className="flex-row items-center border border-gray-300 rounded-lg px-3 bg-white">
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" className="mr-2" />
            <TextInput
              className="flex-1 h-12 text-sm text-gray-900"
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>

        <TouchableOpacity
          className={`bg-purple-600 py-3.5 rounded-lg items-center shadow-lg ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSubmit}
          disabled={isLoading}
          style={{
            shadowColor: '#667eea',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-white text-base font-semibold">
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthCard>
  );
}
