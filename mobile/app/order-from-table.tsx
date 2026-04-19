import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { menuService } from '@/src/services/menu.service';
import { orderService } from '@/src/services/order.service';
import { Category, MenuItem } from '@/src/types';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

export default function OrderFromTableScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([menuService.getCategories(), menuService.getFullMenu()])
      .then(([cats, menuItems]) => {
        setCategories(cats);
        setItems(menuItems);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .catch(() => Alert.alert('Error', 'Failed to load menu'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1, specialInstructions: '' }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(c => c.menuItem.id !== itemId);
      return prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }, []);

  const updateInstructions = useCallback((itemId: number, text: string) => {
    setCart(prev => prev.map(c =>
      c.menuItem.id === itemId ? { ...c, specialInstructions: text } : c
    ));
  }, []);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  const visibleItems = search.trim()
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) && i.isAvailable)
    : items.filter(i => i.categoryId === activeCategory && i.isAvailable);

  const getCartQty = (itemId: number) =>
    cart.find(c => c.menuItem.id === itemId)?.quantity ?? 0;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Please add items before placing order.');
      return;
    }
    setPlacing(true);
    try {
      const order = await orderService.placeOrder({
        tableQrToken: token,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cart.map(c => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          specialInstructions: c.specialInstructions.trim() || undefined,
        })),
      });
      Alert.alert(
        'Order Placed!',
        `Your order #${order.id} has been placed successfully. The kitchen will start preparing it shortly.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: '#9ca3af', marginTop: 12 }}>Loading menu...</Text>
      </View>
    );
  }

  if (showCart) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCart(false)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Order</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {cart.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🛒</Text>
              <Text style={{ color: '#9ca3af' }}>Your cart is empty</Text>
            </View>
          ) : (
            <>
              {cart.map(c => (
                <View key={c.menuItem.id} style={styles.cartCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {c.menuItem.imageUrl ? (
                      <Image source={{ uri: c.menuItem.imageUrl }} style={styles.cartImg} />
                    ) : (
                      <View style={[styles.cartImg, styles.cartImgPlaceholder]}>
                        <Text style={{ fontSize: 20 }}>🍽️</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{c.menuItem.name}</Text>
                      <Text style={styles.cartItemPrice}>NPR {(c.menuItem.price * c.quantity).toFixed(2)}</Text>
                    </View>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(c.menuItem.id)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{c.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(c.menuItem)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    placeholder="Special instructions (optional)"
                    value={c.specialInstructions}
                    onChangeText={t => updateInstructions(c.menuItem.id, t)}
                    style={styles.instructionsInput}
                    placeholderTextColor="#d1d5db"
                  />
                </View>
              ))}

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Your Name (optional)</Text>
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="e.g. John"
                  style={styles.formInput}
                  placeholderTextColor="#9ca3af"
                />
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Order Notes (optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any general notes for your order..."
                  style={[styles.formInput, { height: 72, textAlignVertical: 'top' }]}
                  multiline
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>NPR {cartTotal.toFixed(2)}</Text>
              </View>
              <Text style={styles.totalNote}>+ 13% tax & 10% service charge will apply</Text>
            </>
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.placeOrderBtn, placing && { opacity: 0.6 }]}
              onPress={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.placeOrderText}>Place Order — NPR {cartTotal.toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Menu view
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.headerTitle}>Order Menu</Text>
          <Text style={styles.headerSub}>Table QR scanned ✓</Text>
        </View>
        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBadgeBtn} onPress={() => setShowCart(true)}>
            <Text style={styles.cartBadgeText}>🛒 {cartCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search dishes..."
          style={styles.searchInput}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Category tabs */}
      {!search && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[styles.catTab, activeCategory === cat.id && styles.catTabActive]}
            >
              <Text style={[styles.catTabText, activeCategory === cat.id && styles.catTabTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {visibleItems.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#9ca3af', paddingVertical: 32 }}>No items found</Text>
        ) : (
          visibleItems.map(item => {
            const qty = getCartQty(item.id);
            return (
              <View key={item.id} style={styles.menuCard}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.menuImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.menuImg, styles.menuImgPlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🍽️</Text>
                  </View>
                )}
                <View style={{ flex: 1, padding: 12 }}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={styles.menuItemPrice}>NPR {item.price.toFixed(2)}</Text>
                    {qty === 0 ? (
                      <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Sticky cart button */}
      {cartCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.placeOrderBtn} onPress={() => setShowCart(true)}>
            <Text style={styles.placeOrderText}>
              View Cart ({cartCount} items) — NPR {cartTotal.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  headerSub: { fontSize: 12, color: '#9ca3af' },
  cartBadgeBtn: { backgroundColor: '#f97316', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  cartBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchBox: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1f2937' },
  catTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  catTabActive: { backgroundColor: '#f97316' },
  catTabText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
  catTabTextActive: { color: '#fff' },
  menuCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  menuImg: { width: 96, height: 96 },
  menuImgPlaceholder: { backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  menuItemName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  menuItemDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  menuItemPrice: { fontSize: 14, fontWeight: '700', color: '#f97316' },
  addBtn: { backgroundColor: '#f97316', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { backgroundColor: '#f3f4f6', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  qtyNum: { fontSize: 15, fontWeight: '700', color: '#1f2937', minWidth: 20, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  placeOrderBtn: { backgroundColor: '#f97316', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cartCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cartImg: { width: 56, height: 56, borderRadius: 10 },
  cartImgPlaceholder: { backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  cartItemPrice: { fontSize: 13, color: '#f97316', fontWeight: '600', marginTop: 2 },
  instructionsInput: { marginTop: 10, backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#374151', borderWidth: 1, borderColor: '#e5e7eb' },
  formSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  formInput: { backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1f2937', borderWidth: 1, borderColor: '#e5e7eb' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#f97316' },
  totalNote: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginBottom: 80 },
});
