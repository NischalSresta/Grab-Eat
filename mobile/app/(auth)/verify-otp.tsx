import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { AuthCard } from '@/src/components/auth/AuthCard';
import { Alert } from '@/src/components/auth/Alert';
import { OTPInput } from '@/src/components/auth/OTPInput';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyEmail, resendVerification } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/request-verification');
    }
  }, [email]);

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(email!, otp);
      setSuccessMessage('Email verified successfully! Redirecting to login...');
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setSuccessMessage('');
    setError(null);

    try {
      await resendVerification(email!);
      setSuccessMessage('New verification code sent! Check your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthCard
      title="Verify Your Email"
      description={`Enter the 6-digit code sent to ${email}`}
      footer={
        <Text className="text-sm text-white/90">
          Wrong email?{' '}
          <Link href="/(auth)/request-verification" className="font-semibold underline">
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
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={handleResend}
          disabled={resendLoading || isLoading}
        >
          <Text className={`text-sm font-semibold text-purple-600 ${(resendLoading || isLoading) ? 'opacity-50' : ''}`}>
            {resendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthCard>
  );
}
