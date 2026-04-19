import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { orderService } from '@/src/services/order.service';
import { useAuth } from '@/src/hooks/useAuth';
import { Order, OrderStatus } from '@/src/types';

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#fef3c7', text: '#d97706', label: 'Pending' },
  CONFIRMED: { bg: '#dbeafe', text: '#2563eb', label: 'Confirmed' },
  PREPARING: { bg: '#ede9fe', text: '#7c3aed', label: 'Preparing' },
  READY: { bg: '#dcfce7', text: '#16a34a', label: 'Ready' },
  SERVED: { bg: '#f0fdf4', text: '#15803d', label: 'Served' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const result = await orderService.getMyOrders();
      setOrders(result);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text style={{ fontSize: 40 }}>📋</Text>
        <Text className="text-gray-700 font-semibold text-center mt-3">Log in to see your orders</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900">My Orders</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
      >
        {error ? (
          <Text className="text-red-500 text-center py-8">{error}</Text>
        ) : orders.length === 0 ? (
          <View className="items-center py-16">
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text className="text-gray-400 mt-3 text-center">No orders yet</Text>
          </View>
        ) : (
          orders.map(order => {
            const s = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
            const isExpanded = expandedId === order.id;
            return (
              <TouchableOpacity
                key={order.id}
                onPress={() => setExpandedId(isExpanded ? null : order.id)}
                activeOpacity={0.9}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  marginBottom: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Order #{order.id}</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      Table {order.tableNumber} · {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <View style={{ backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                      <Text style={{ color: s.text, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#f97316' }}>
                      NPR {order.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {isExpanded && (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 }}>
                    {order.items.map(item => (
                      <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, color: '#374151' }}>{item.quantity}× {item.menuItemName}</Text>
                        <Text style={{ fontSize: 13, color: '#6b7280' }}>NPR {item.lineTotal.toFixed(2)}</Text>
                      </View>
                    ))}
                    <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', marginTop: 8, paddingTop: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ fontSize: 12, color: '#9ca3af' }}>Subtotal</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>NPR {order.subtotal.toFixed(2)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ fontSize: 12, color: '#9ca3af' }}>Tax (13%)</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>NPR {order.taxAmount.toFixed(2)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ fontSize: 12, color: '#9ca3af' }}>Service (10%)</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>NPR {order.serviceChargeAmount.toFixed(2)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Total</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#f97316' }}>NPR {order.totalAmount.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
