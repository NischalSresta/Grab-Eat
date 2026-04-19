import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { menuService } from '@/src/services/menu.service';
import { Category, MenuItem, TopPick } from '@/src/types';

export default function MenuScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [topPicks, setTopPicks] = useState<TopPick[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      menuService.getCategories(),
      menuService.getFullMenu(),
      menuService.getTopPicks(),
    ])
      .then(([cats, menuItems, picks]) => {
        setCategories(cats);
        setItems(menuItems);
        setTopPicks(picks);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .catch(() => setError('Failed to load menu'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback(async (text: string) => {
    setSearch(text);
    if (!text.trim()) { setSearchResults(null); return; }
    try {
      const results = await menuService.searchMenu(text);
      setSearchResults(results);
    } catch { /* silent */ }
  }, []);

  const visibleItems = searchResults !== null
    ? searchResults
    : items.filter(i => i.categoryId === activeCategory && i.isAvailable);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="text-gray-500 mt-3">Loading menu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-2xl mb-2">😕</Text>
        <Text className="text-gray-700 font-semibold text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search */}
      <View className="bg-white px-4 pt-12 pb-3 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Menu</Text>
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search dishes..."
          className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Category tabs */}
      {!search && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white border-b border-gray-100"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: activeCategory === cat.id ? '#f97316' : '#f3f4f6',
                marginRight: 8,
              }}
            >
              <Text style={{ color: activeCategory === cat.id ? '#fff' : '#4b5563', fontWeight: '600', fontSize: 13 }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Top Picks banner */}
        {!search && topPicks.length > 0 && (
          <View className="mb-5">
            <Text className="text-base font-bold text-gray-800 mb-3">⭐ This Week's Top Picks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              {topPicks.map(pick => (
                <View
                  key={pick.id}
                  style={{
                    width: 130,
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginHorizontal: 4,
                    borderWidth: 1,
                    borderColor: '#fed7aa',
                  }}
                >
                  {pick.imageUrl ? (
                    <Image source={{ uri: pick.imageUrl }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: '100%', height: 80, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 28 }}>🍽️</Text>
                    </View>
                  )}
                  <View style={{ padding: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#1f2937' }} numberOfLines={1}>{pick.menuItemName}</Text>
                    <Text style={{ fontSize: 11, color: '#f97316', fontWeight: '700' }}>NPR {pick.price}</Text>
                    <Text style={{ fontSize: 10, color: '#9ca3af' }}>{pick.totalOrdered} orders</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu Items */}
        {visibleItems.length === 0 ? (
          <Text className="text-center text-gray-400 py-8">No items found</Text>
        ) : (
          visibleItems.map(item => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 96, height: 96, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32 }}>🍽️</Text>
                </View>
              )}
              <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 4 }} numberOfLines={1}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {item.isVegetarian && <Text style={{ fontSize: 10, backgroundColor: '#dcfce7', color: '#15803d', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>🌿</Text>}
                      {item.isSpicy && <Text style={{ fontSize: 10, backgroundColor: '#fee2e2', color: '#dc2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>🌶️</Text>}
                    </View>
                  </View>
                  {item.description && (
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#f97316', marginTop: 6 }}>NPR {item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
