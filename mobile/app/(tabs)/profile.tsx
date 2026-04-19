import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { loyaltyService } from '@/src/services/loyalty.service';
import { LoyaltyAccount, Reward } from '@/src/types';

const TIER_GRADIENT: Record<string, { bg: string; text: string; badge: string }> = {
  BRONZE: { bg: '#92400e', text: '#fef3c7', badge: '#f59e0b' },
  SILVER: { bg: '#6b7280', text: '#f9fafb', badge: '#9ca3af' },
  GOLD: { bg: '#b45309', text: '#fef9c3', badge: '#f59e0b' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoyaltyLoading(true);
    Promise.all([
      loyaltyService.getMyAccount(),
      loyaltyService.getAvailableRewards(),
    ])
      .then(([acc, rews]) => { setLoyalty(acc); setRewards(rews); })
      .catch(() => {/* silent */})
      .finally(() => setLoyaltyLoading(false));
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleRedeem = async (rewardId: number) => {
    setRedeeming(rewardId);
    try {
      const updated = await loyaltyService.redeemReward(rewardId);
      setLoyalty(updated);
    } catch { /* silent */ }
    finally { setRedeeming(null); }
  };

  const tierStyle = loyalty ? (TIER_GRADIENT[loyalty.tier] || TIER_GRADIENT.BRONZE) : TIER_GRADIENT.BRONZE;
  const nextTier = loyalty?.tier === 'BRONZE' ? { name: 'SILVER', need: 500 } : loyalty?.tier === 'SILVER' ? { name: 'GOLD', need: 1000 } : null;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ backgroundColor: tierStyle.bg, paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{user?.fullName}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{user?.email}</Text>
            {loyalty && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginTop: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>⭐ {loyalty.tier} · {loyalty.currentPoints} pts</Text>
              </View>
            )}
          </View>
        </View>

        {/* Loyalty Card */}
        {loyaltyLoading ? (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <ActivityIndicator color="#f97316" />
          </View>
        ) : loyalty ? (
          <View style={{ margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Loyalty Points</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>Current</Text>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#f97316' }}>{loyalty.currentPoints}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>Lifetime</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#6b7280' }}>{loyalty.lifetimePoints}</Text>
              </View>
            </View>
            {nextTier && (
              <>
                <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                  <View style={{ backgroundColor: '#f97316', height: 8, width: `${Math.min(100, (loyalty.lifetimePoints / nextTier.need) * 100)}%`, borderRadius: 8 }} />
                </View>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>{nextTier.need - loyalty.lifetimePoints} pts to {nextTier.name}</Text>
              </>
            )}

            {/* Rewards */}
            {rewards.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Available Rewards</Text>
                {rewards.map(reward => {
                  const canRedeem = loyalty.currentPoints >= reward.pointsCost;
                  return (
                    <View
                      key={reward.id}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{reward.name}</Text>
                        <Text style={{ fontSize: 11, color: '#9ca3af' }}>{reward.pointsCost} pts · NPR {reward.discountAmount} off</Text>
                      </View>
                      <TouchableOpacity
                        disabled={!canRedeem || redeeming === reward.id}
                        onPress={() => handleRedeem(reward.id)}
                        style={{
                          backgroundColor: canRedeem ? '#f97316' : '#e5e7eb',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ color: canRedeem ? '#fff' : '#9ca3af', fontSize: 12, fontWeight: '600' }}>
                          {redeeming === reward.id ? '...' : 'Redeem'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {/* Info */}
        <View style={{ margin: 16, marginTop: 0, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>Role</Text>
            <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14 }}>{user?.role}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>Status</Text>
            <Text style={{ fontWeight: '600', color: '#16a34a', fontSize: 14 }}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 16 }}>
          <Button title="Logout" variant="outline" onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}
