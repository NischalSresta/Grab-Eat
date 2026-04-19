import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-red-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 48, flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardDismissMode="on-drag"
        >
          {/* Logo/Brand */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-red-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
              <Text className="text-3xl font-bold text-white">GE</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
            <Text className="text-gray-600 text-center mt-2">Sign in to your GrabEat account</Text>
          </View>

          {/* Login Form */}
          <View className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-6">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="your-email-address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                />
              )}
            />

            <TouchableOpacity 
              onPress={() => router.push('/(auth)/forgot-password')}
              className="mb-4"
            >
              <Text className="text-right text-red-600 font-medium text-sm">
                Forgot password?
              </Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              fullWidth
            />

            <View className="mt-6">
              <Text className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Text 
                  onPress={() => router.push('/(auth)/register')}
                  className="text-red-600 font-semibold"
                >
                  Sign up
                </Text>
              </Text>
            </View>
          </View>

          {/* Verify Email Link */}
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/request-verification')}
            className="mb-4"
          >
            <Text className="text-center text-sm text-gray-600">
              Need to verify your email?{' '}
              <Text className="text-red-600 font-semibold">Verify Now</Text>
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-sm text-gray-500">
            © 2025 GrabEat. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
