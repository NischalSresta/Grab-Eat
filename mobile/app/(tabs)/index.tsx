import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { tableService } from '@/src/services/table.service';
import {
  BookingItem,
  BookingStatus,
  TABLE_FLOOR_ICONS,
  TABLE_FLOOR_LABELS,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_BG,
} from '@/src/types';

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const loadRecent = useCallback(async () => {
    try {
      const page = await tableService.getMyBookings(0, 3);
      setRecentBookings(page.content ?? []);
    } catch {
      // silently fail
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const pendingCount = recentBookings.filter(b => b.status === 'PENDING').length;
  const confirmedCount = recentBookings.filter(b => b.status === 'CONFIRMED').length;

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Hero Banner */}
      <View className="bg-red-600 px-6 pt-8 pb-10 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold mb-1">
          Hey, {user?.fullName?.split(' ')[0]}! 👋
        </Text>
        <Text className="text-red-100 text-sm mb-6">
          Ready for a great dining experience?
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/bookings')}
          className="bg-white rounded-2xl px-5 py-3 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-red-600 font-bold text-base">Book a Table</Text>
            <Text className="text-gray-500 text-xs mt-0.5">Reserve your perfect spot</Text>
          </View>
          <Text className="text-red-600 text-xl">🪑</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 -mt-4">
        {/* Stats Row */}
        <View className="flex-row gap-3 mb-5 mt-2">
          {[
            { label: 'Pending', count: pendingCount, icon: '⏳', bg: '#fef3c7', text: '#d97706' },
            { label: 'Confirmed', count: confirmedCount, icon: '✅', bg: '#dcfce7', text: '#16a34a' },
            {
              label: 'Since',
              count: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '—',
              icon: '🎉',
              bg: '#ede9fe',
              text: '#7c3aed',
            },
          ].map(s => (
            <View
              key={s.label}
              className="flex-1 rounded-2xl p-3 items-center shadow-sm"
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3f4f6' }}
            >
              <Text className="text-2xl mb-1">{s.icon}</Text>
              <Text className="text-lg font-bold" style={{ color: s.text }}>{s.count}</Text>
              <Text className="text-xs text-gray-500">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text className="text-gray-800 text-base font-bold mb-3">Quick Actions</Text>

        {/* Scan to Order - prominent CTA */}
        <TouchableOpacity
          onPress={() => router.push('/scan')}
          className="rounded-2xl p-4 mb-3 flex-row items-center gap-4"
          style={{ backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#fed7aa' }}
        >
          <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: '#f97316' }}>
            <Text style={{ fontSize: 22 }}>📷</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-base" style={{ color: '#c2410c' }}>Scan QR & Order</Text>
            <Text className="text-xs" style={{ color: '#9a3412' }}>Scan your table QR code to place an order</Text>
          </View>
          <Text style={{ color: '#f97316', fontSize: 18 }}>→</Text>
        </TouchableOpacity>

        <View className="flex-row gap-3 mb-5">
          {[
            {
              icon: '🪑',
              label: 'Book Table',
              bg: '#fee2e2',
              text: '#dc2626',
              route: '/(tabs)/bookings' as const,
            },
            {
              icon: '📋',
              label: 'My Orders',
              bg: '#dbeafe',
              text: '#2563eb',
              route: '/(tabs)/orders' as const,
            },
          ].map(action => (
            <TouchableOpacity
              key={action.label}
              onPress={() => router.push(action.route)}
              className="flex-1 rounded-2xl p-4 items-center shadow-sm"
              style={{ backgroundColor: action.bg }}
            >
              <Text className="text-3xl mb-2">{action.icon}</Text>
              <Text className="text-sm font-semibold" style={{ color: action.text }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Bookings */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-800 text-base font-bold">Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
            <Text className="text-red-600 text-sm font-medium">See all →</Text>
          </TouchableOpacity>
        </View>

        {bookingsLoading ? (
          <View className="bg-white rounded-2xl p-8 items-center shadow-sm mb-4">
            <ActivityIndicator color="#dc2626" />
          </View>
        ) : recentBookings.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center shadow-sm mb-4">
            <Text className="text-4xl mb-3">🪑</Text>
            <Text className="text-gray-500 text-sm text-center">
              No bookings yet. Make your first reservation!
            </Text>
          </View>
        ) : (
          <View className="gap-3 mb-4">
            {recentBookings.map(booking => (
              <View
                key={booking.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <View
                  className="h-1"
                  style={{ backgroundColor: BOOKING_STATUS_COLORS[booking.status] }}
                />
                <View className="p-4 flex-row items-center gap-3">
                  <Text className="text-2xl">
                    {TABLE_FLOOR_ICONS[booking.tableFloor]}
                  </Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">
                      Table {booking.tableNumber}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {TABLE_FLOOR_LABELS[booking.tableFloor]} · {formatDate(booking.bookingDate)}{' '}
                      · {booking.startTime.slice(0, 5)}–{booking.endTime.slice(0, 5)}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: BOOKING_STATUS_BG[booking.status] }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: BOOKING_STATUS_COLORS[booking.status] }}
                    >
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Account Details */}
        <Text className="text-gray-800 text-base font-bold mb-3">Account</Text>
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          {[
            { label: 'Name', value: user?.fullName },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role },
          ].map(({ label, value }) => (
            <View
              key={label}
              className="flex-row justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <Text className="text-gray-500 text-sm">{label}</Text>
              <Text className="text-gray-800 text-sm font-medium">{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
