import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { loyaltyService } from '@/src/services/loyalty.service';
import { userService } from '@/src/services/user.service';
import { LoyaltyAccount, Reward } from '@/src/types';

const TIER_GRADIENT: Record<string, { bg: string; text: string; badge: string }> = {
  BRONZE: { bg: '#92400e', text: '#fef3c7', badge: '#f59e0b' },
  SILVER: { bg: '#6b7280', text: '#f9fafb', badge: '#9ca3af' },
  GOLD: { bg: '#b45309', text: '#fef9c3', badge: '#f59e0b' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  // Edit profile modal
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Change password modal
  const [pwVisible, setPwVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoyaltyLoading(true);
    Promise.all([
      loyaltyService.getMyAccount(),
      loyaltyService.getAvailableRewards(),
    ])
      .then(([acc, rews]) => { setLoyalty(acc); setRewards(rews); })
      .catch(() => {/* silent — loyalty may not exist yet */})
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
      Alert.alert('Redeemed!', 'Your reward has been applied successfully.');
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not redeem reward. Please try again.');
    } finally {
      setRedeeming(null);
    }
  };

  const openEditModal = () => {
    setEditName(user?.fullName ?? '');
    setEditPhone(user?.phoneNumber ?? '');
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation', 'Full name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await userService.updateProfile({
        fullName: editName.trim(),
        phoneNumber: editPhone.trim() || undefined,
      });
      await refreshUser();
      setEditVisible(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Validation', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters.');
      return;
    }
    setChangingPw(true);
    try {
      await userService.changePassword({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });
      setPwVisible(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Success', 'Password changed successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to change password.');
    } finally {
      setChangingPw(false);
    }
  };

  const tierStyle = loyalty ? (TIER_GRADIENT[loyalty.tier] || TIER_GRADIENT.BRONZE) : TIER_GRADIENT.BRONZE;
  const nextTier = loyalty?.tier === 'BRONZE'
    ? { name: 'SILVER', need: 500 }
    : loyalty?.tier === 'SILVER'
    ? { name: 'GOLD', need: 1000 }
    : null;

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
            <TouchableOpacity
              onPress={openEditModal}
              style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20 }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>✏️  Edit Profile</Text>
            </TouchableOpacity>
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

            {rewards.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Available Rewards</Text>
                {rewards.map(reward => {
                  const canRedeem = loyalty.currentPoints >= reward.pointsCost;
                  return (
                    <View key={reward.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{reward.name}</Text>
                        <Text style={{ fontSize: 11, color: '#9ca3af' }}>{reward.pointsCost} pts · NPR {reward.discountAmount} off</Text>
                      </View>
                      <TouchableOpacity
                        disabled={!canRedeem || redeeming === reward.id}
                        onPress={() => handleRedeem(reward.id)}
                        style={{ backgroundColor: canRedeem ? '#f97316' : '#e5e7eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
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

        {/* Account Info */}
        <View style={{ margin: 16, marginTop: 0, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          {[
            { label: 'Name', value: user?.fullName },
            { label: 'Email', value: user?.email },
            { label: 'Phone', value: user?.phoneNumber || '—' },
            { label: 'Role', value: user?.role },
            { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive', color: user?.isActive ? '#16a34a' : '#dc2626' },
          ].map(({ label, value, color }) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>{label}</Text>
              <Text style={{ fontWeight: '600', color: color ?? '#111827', fontSize: 14 }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <TouchableOpacity
            onPress={() => setPwVisible(true)}
            style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' }}
          >
            <Text style={{ fontSize: 18, marginRight: 10 }}>🔑</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Change Password</Text>
            <Text style={{ marginLeft: 'auto', color: '#9ca3af' }}>→</Text>
          </TouchableOpacity>
          <Button title="Logout" variant="outline" onPress={handleLogout} />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              style={styles.input}
              placeholder="e.g. +977 98XXXXXXXX"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={pwVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPwVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPwVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={changingPw}>
              <Text style={[styles.modalSave, changingPw && { opacity: 0.5 }]}>{changingPw ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput value={currentPw} onChangeText={setCurrentPw} style={styles.input} secureTextEntry placeholder="••••••••" placeholderTextColor="#9ca3af" />
            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput value={newPw} onChangeText={setNewPw} style={styles.input} secureTextEntry placeholder="Min 8 characters" placeholderTextColor="#9ca3af" />
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput value={confirmPw} onChangeText={setConfirmPw} style={styles.input} secureTextEntry placeholder="Repeat new password" placeholderTextColor="#9ca3af" />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalCancel: { fontSize: 15, color: '#6b7280' },
  modalSave: { fontSize: 15, color: '#f97316', fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb' },
});
