import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { tableService } from '@/src/services/table.service';
import {
  TableItem,
  BookingItem,
  BookingStatus,
  TableFloor,
  TableStatus,
  PageResponse,
  TABLE_FLOOR_ICONS,
  TABLE_FLOOR_LABELS,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_BG,
} from '@/src/types';

const ALL_FLOORS: TableFloor[] = ['INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE_DINING', 'TERRACE'];

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

// Table status colours for the map
const TABLE_STATUS_BG: Record<TableStatus, string> = {
  AVAILABLE: '#ffffff',
  RESERVED: '#dcfce7',
  OCCUPIED: '#fee2e2',
  MAINTENANCE: '#f3f4f6',
};
const TABLE_STATUS_BORDER: Record<TableStatus, string> = {
  AVAILABLE: '#d1d5db',
  RESERVED: '#4ade80',
  OCCUPIED: '#f87171',
  MAINTENANCE: '#9ca3af',
};
const TABLE_STATUS_TEXT: Record<TableStatus, string> = {
  AVAILABLE: '#374151',
  RESERVED: '#166534',
  OCCUPIED: '#991b1b',
  MAINTENANCE: '#6b7280',
};
const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  AVAILABLE: 'Empty',
  RESERVED: 'Booking in Progress',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
};

type MainTab = 'book' | 'map' | 'my-bookings';
type BookStep = 'search' | 'pick' | 'confirm' | 'success';

export default function BookingsScreen() {
  const [mainTab, setMainTab] = useState<MainTab>('book');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Tab Switcher */}
      <View className="flex-row bg-white border-b border-gray-200 px-2 pt-3">
        {(
          [
            ['book', '🪑  Book'],
            ['map', '🗺️  Map'],
            ['my-bookings', '📋  Mine'],
          ] as [MainTab, string][]
        ).map(([tab, label]) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setMainTab(tab)}
            className={`flex-1 pb-3 items-center border-b-2 ${
              mainTab === tab ? 'border-red-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                mainTab === tab ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mainTab === 'book' && <BookTableView />}
      {mainTab === 'map' && <FloorMapView />}
      {mainTab === 'my-bookings' && <MyBookingsView />}
    </View>
  );
}

// ── Floor Map ─────────────────────────────────────────────────────────────────

function FloorMapView() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<TableItem | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tableService.getAllTables();
      setTables(data);
    } catch {
      Alert.alert('Error', 'Could not load floor map.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const FLOOR_ORDER: TableFloor[] = [
    'INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE_DINING', 'TERRACE',
  ];

  const grouped = FLOOR_ORDER.reduce<Record<string, TableItem[]>>((acc, f) => {
    const ft = tables.filter(t => t.floor === f && t.isActive);
    if (ft.length) acc[f] = ft;
    return acc;
  }, {});

  const available = tables.filter(t => t.status === 'AVAILABLE' && t.isActive).length;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#dc2626" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
      {/* Hero */}
      <View className="bg-red-600 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold text-base">Live Floor Map</Text>
          <Text className="text-red-100 text-xs mt-0.5">Tap a table to see details</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-2xl font-bold">{available}</Text>
          <Text className="text-red-200 text-xs">Available</Text>
        </View>
      </View>

      {/* Legend */}
      <View className="bg-white rounded-2xl p-3 mb-4 flex-row flex-wrap gap-3">
        {(
          [
            ['AVAILABLE', '#d1fae5', '#059669', '⬜ Empty'],
            ['RESERVED', '#dcfce7', '#16a34a', '🟩 Booked'],
            ['OCCUPIED', '#fee2e2', '#dc2626', '🟥 Occupied'],
            ['MAINTENANCE', '#f3f4f6', '#6b7280', '⬜ Maint.'],
          ] as const
        ).map(([, bg, color, label]) => (
          <View key={label} className="flex-row items-center gap-1.5">
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: bg, borderWidth: 1, borderColor: color }} />
            <Text style={{ fontSize: 11, color: '#374151' }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Refresh */}
      <TouchableOpacity onPress={load} className="flex-row items-center justify-end mb-3">
        <Text className="text-red-600 text-sm font-medium">↻ Refresh</Text>
      </TouchableOpacity>

      {/* Floor sections */}
      {Object.entries(grouped).map(([floor, floorTables]) => (
        <View key={floor} className="mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-base font-bold text-gray-800">
              {TABLE_FLOOR_ICONS[floor as TableFloor]} {TABLE_FLOOR_LABELS[floor as TableFloor]}
            </Text>
            <Text className="text-xs text-gray-400">({floorTables.length} tables)</Text>
          </View>
          <View
            className="rounded-2xl p-4"
            style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}
          >
            <View className="flex-row flex-wrap gap-3">
              {floorTables
                .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }))
                .map(table => (
                  <TouchableOpacity
                    key={table.id}
                    onPress={() => setSelected(prev => (prev?.id === table.id ? null : table))}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      backgroundColor: TABLE_STATUS_BG[table.status],
                      borderWidth: selected?.id === table.id ? 3 : 2,
                      borderColor: selected?.id === table.id ? '#dc2626' : TABLE_STATUS_BORDER[table.status],
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: TABLE_STATUS_TEXT[table.status], textAlign: 'center' }}>
                      {table.tableNumber}
                    </Text>
                    <Text style={{ fontSize: 18, lineHeight: 22 }}>🍽️</Text>
                    <Text style={{ fontSize: 9, color: TABLE_STATUS_TEXT[table.status], opacity: 0.8 }}>
                      {table.capacity}p
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>
      ))}

      {/* Selected table card */}
      {selected && (
        <View
          className="rounded-2xl p-4 mb-4"
          style={{
            backgroundColor: TABLE_STATUS_BG[selected.status],
            borderWidth: 2,
            borderColor: TABLE_STATUS_BORDER[selected.status],
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">🍽️</Text>
              <View>
                <Text className="font-bold text-gray-900">Table {selected.tableNumber}</Text>
                <Text className="text-xs text-gray-500">
                  {TABLE_FLOOR_ICONS[selected.floor]} {TABLE_FLOOR_LABELS[selected.floor]} · {selected.capacity} seats
                </Text>
                <Text
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: TABLE_STATUS_TEXT[selected.status] }}
                >
                  {TABLE_STATUS_LABELS[selected.status]}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          {selected.description && (
            <Text className="text-xs text-gray-500 italic mt-2 bg-white/60 rounded-xl px-3 py-2">
              "{selected.description}"
            </Text>
          )}
        </View>
      )}

      {Object.keys(grouped).length === 0 && (
        <View className="items-center py-12">
          <Text className="text-5xl mb-3">🪑</Text>
          <Text className="text-gray-500 font-medium">No tables configured yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Book a Table ─────────────────────────────────────────────────────────────

function BookTableView() {
  const [step, setStep] = useState<BookStep>('search');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [floor, setFloor] = useState<TableFloor | 'ALL'>('ALL');
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async () => {
    if (!date || !startTime || !endTime) {
      Alert.alert('Missing Info', 'Please fill in date, start time, and end time.');
      return;
    }
    if (startTime >= endTime) {
      Alert.alert('Invalid Time', 'Start time must be before end time.');
      return;
    }
    setSearchError(null);
    setIsSearching(true);
    try {
      const result = await tableService.getAvailableTables(
        date,
        startTime,
        endTime,
        partySize,
        floor === 'ALL' ? undefined : floor
      );
      setTables(result);
      setStep('pick');
    } catch {
      setSearchError('Could not load tables. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTable) return;
    setIsBooking(true);
    try {
      const booking = await tableService.createBooking({
        tableId: selectedTable.id,
        bookingDate: date,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
        partySize,
        specialRequests: specialRequests.trim() || undefined,
      });
      setCreatedId(booking.id);
      setStep('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Booking failed. Please try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setIsBooking(false);
    }
  };

  const reset = () => {
    setStep('search');
    setSelectedTable(null);
    setSpecialRequests('');
    setTables([]);
    setSearchError(null);
  };

  if (step === 'success') {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 items-center justify-center px-6 py-12">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">✅</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Booking Submitted!
          </Text>
          <Text className="text-gray-500 text-sm text-center mb-1">
            Your booking #{createdId} is pending confirmation.
          </Text>
          <Text className="text-gray-400 text-xs text-center mb-8">
            We'll confirm your reservation shortly.
          </Text>
          <TouchableOpacity
            onPress={reset}
            className="bg-red-600 rounded-2xl px-8 py-3 mb-3 w-full items-center"
          >
            <Text className="text-white font-bold">Book Another Table</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === 'confirm' && selectedTable) {
    return (
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity
          onPress={() => setStep('pick')}
          className="flex-row items-center gap-2 mb-4"
        >
          <Text className="text-gray-500">← Back</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900 mb-4">Confirm Booking</Text>

        {/* Summary Card */}
        <View className="bg-red-600 rounded-2xl p-5 mb-4">
          <Text className="text-white text-xl font-bold">
            {TABLE_FLOOR_ICONS[selectedTable.floor]} Table {selectedTable.tableNumber}
          </Text>
          <Text className="text-red-100 text-sm mt-1">
            {TABLE_FLOOR_LABELS[selectedTable.floor]}
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4 gap-3">
          {[
            { label: '📅 Date', value: date },
            { label: '🕐 Time', value: `${startTime} – ${endTime}` },
            { label: '👥 Party Size', value: `${partySize} people` },
            { label: '🪑 Capacity', value: `Up to ${selectedTable.capacity} people` },
          ].map(({ label, value }) => (
            <View key={label} className="flex-row justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <Text className="text-gray-500 text-sm">{label}</Text>
              <Text className="text-gray-800 text-sm font-medium">{value}</Text>
            </View>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-2">
          Special Requests (optional)
        </Text>
        <TextInput
          value={specialRequests}
          onChangeText={setSpecialRequests}
          placeholder="Allergies, occasion, seating preferences…"
          multiline
          numberOfLines={3}
          maxLength={500}
          className="bg-white rounded-2xl p-4 text-gray-800 text-sm mb-4"
          style={{ minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e5e7eb' }}
        />

        {isBooking ? (
          <ActivityIndicator color="#dc2626" size="large" />
        ) : (
          <>
            <TouchableOpacity
              onPress={handleConfirm}
              className="bg-red-600 rounded-2xl py-4 items-center mb-3"
            >
              <Text className="text-white font-bold text-base">Confirm Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStep('pick')}
              className="bg-gray-100 rounded-2xl py-4 items-center"
            >
              <Text className="text-gray-700 font-medium">Back to Tables</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }

  if (step === 'pick') {
    const grouped = tables.reduce<Record<string, TableItem[]>>((acc, t) => {
      if (!acc[t.floor]) acc[t.floor] = [];
      acc[t.floor].push(t);
      return acc;
    }, {});

    return (
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity
          onPress={() => setStep('search')}
          className="flex-row items-center mb-4"
        >
          <Text className="text-gray-500">← Modify Search</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900 mb-1">Available Tables</Text>
        <Text className="text-gray-500 text-sm mb-4">
          {date} · {startTime}–{endTime} · {partySize} people
        </Text>

        {tables.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-5xl mb-3">🪑</Text>
            <Text className="text-gray-700 font-semibold text-base mb-1">No Tables Available</Text>
            <Text className="text-gray-400 text-sm text-center px-8">
              Try a different date, time, or reduce party size.
            </Text>
            <TouchableOpacity onPress={() => setStep('search')} className="mt-4">
              <Text className="text-red-600 font-semibold">Change Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(grouped).map(([floorKey, floorTables]) => (
            <View key={floorKey} className="mb-6">
              <Text className="text-base font-bold text-gray-800 mb-3">
                {TABLE_FLOOR_ICONS[floorKey as TableFloor]}{' '}
                {TABLE_FLOOR_LABELS[floorKey as TableFloor]}
              </Text>
              <View className="gap-3">
                {floorTables.map(table => (
                  <TouchableOpacity
                    key={table.id}
                    onPress={() => { setSelectedTable(table); setStep('confirm'); }}
                    className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
                    style={{ borderWidth: 1, borderColor: '#f3f4f6' }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-12 h-12 bg-red-50 rounded-2xl items-center justify-center">
                        <Text className="text-red-600 font-bold text-sm">{table.tableNumber}</Text>
                      </View>
                      <View>
                        <Text className="font-semibold text-gray-800">Table {table.tableNumber}</Text>
                        <Text className="text-gray-500 text-xs">Up to {table.capacity} people</Text>
                        {table.description && (
                          <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                            {table.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-green-700 text-xs font-semibold">Select →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // Default: Search step
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
      {/* Hero */}
      <View className="bg-red-600 rounded-2xl p-5 mb-5">
        <Text className="text-white text-lg font-bold mb-1">Find Your Perfect Table</Text>
        <Text className="text-red-100 text-xs">
          Select date, time, and party size to see available tables.
        </Text>
      </View>

      {searchError && (
        <View className="bg-red-50 rounded-xl p-3 mb-4">
          <Text className="text-red-600 text-sm">{searchError}</Text>
        </View>
      )}

      <View className="bg-white rounded-2xl p-4 mb-4 gap-4">
        {/* Date */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">📅 Date (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder={today}
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            keyboardType="numeric"
          />
        </View>

        {/* Time */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">🕐 From (HH:MM)</Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="18:00"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">🕑 To (HH:MM)</Text>
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              placeholder="20:00"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Party Size */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">👥 Party Size</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => setPartySize(v => Math.max(1, v - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-lg font-bold text-gray-700">−</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800 w-8 text-center">{partySize}</Text>
            <TouchableOpacity
              onPress={() => setPartySize(v => Math.min(20, v + 1))}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-lg font-bold text-gray-700">+</Text>
            </TouchableOpacity>
            <Text className="text-gray-400 text-sm">people</Text>
          </View>
        </View>

        {/* Floor Filter */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">📍 Area / Floor</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setFloor('ALL')}
                className={`px-4 py-2 rounded-full border ${
                  floor === 'ALL'
                    ? 'bg-red-600 border-red-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    floor === 'ALL' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  🍽️ All
                </Text>
              </TouchableOpacity>
              {ALL_FLOORS.map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFloor(f)}
                  className={`px-4 py-2 rounded-full border ${
                    floor === f ? 'bg-red-600 border-red-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      floor === f ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {TABLE_FLOOR_ICONS[f]} {TABLE_FLOOR_LABELS[f]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {isSearching ? (
        <ActivityIndicator color="#dc2626" size="large" />
      ) : (
        <TouchableOpacity
          onPress={handleSearch}
          className="bg-red-600 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold text-base">🔍 Search Available Tables</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── My Bookings ───────────────────────────────────────────────────────────────

interface ConfirmedNotif {
  tableNumber: string;
  bookingDate: string;
  startTime: string;
  partySize: number;
}

function MyBookingsView() {
  const [page, setPage] = useState<PageResponse<BookingItem> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmedNotif, setConfirmedNotif] = useState<ConfirmedNotif | null>(null);
  const prevStatuses = useRef<Record<number, BookingStatus>>({});
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const data = await tableService.getMyBookings(p, 10);
      setPage(data);

      // Detect PENDING → CONFIRMED to show notification to customer
      const hasPrev = Object.keys(prevStatuses.current).length > 0;
      if (hasPrev) {
        const newlyConfirmed = data.content.filter(
          (b: BookingItem) =>
            b.status === 'CONFIRMED' && prevStatuses.current[b.id] === 'PENDING'
        );
        if (newlyConfirmed.length > 0) {
          const b = newlyConfirmed[0];
          if (notifTimer.current) clearTimeout(notifTimer.current);
          setConfirmedNotif({
            tableNumber: b.tableNumber,
            bookingDate: b.bookingDate,
            startTime: b.startTime,
            partySize: b.partySize,
          });
          notifTimer.current = setTimeout(() => setConfirmedNotif(null), 7000);
        }
      }

      const updated: Record<number, BookingStatus> = {};
      data.content.forEach((b: BookingItem) => { updated[b.id] = b.status; });
      prevStatuses.current = updated;
    } catch {
      Alert.alert('Error', 'Failed to load your bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentPage);
  }, [load, currentPage]);

  // Poll every 15 s to catch booking confirmation from admin
  useEffect(() => {
    const id = setInterval(() => load(currentPage), 15_000);
    return () => {
      clearInterval(id);
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, [currentPage, load]);

  const handleCancel = async (booking: BookingItem) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel Table ${booking.tableNumber} on ${booking.bookingDate}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              await tableService.cancelBooking(booking.id);
              load(currentPage);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel booking.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#dc2626" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
      {/* Booking-confirmed notification banner */}
      {confirmedNotif && (
        <View
          style={{
            backgroundColor: '#16a34a',
            borderRadius: 14,
            padding: 14,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Pulsing dot placeholder (static on RN) */}
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#fff',
              flexShrink: 0,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              Your booking has been confirmed!
            </Text>
            <Text style={{ color: '#bbf7d0', fontSize: 11, marginTop: 2 }}>
              Table {confirmedNotif.tableNumber} · {confirmedNotif.partySize}{' '}
              {confirmedNotif.partySize === 1 ? 'guest' : 'guests'} ·{' '}
              {confirmedNotif.bookingDate} at {confirmedNotif.startTime.slice(0, 5)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setConfirmedNotif(null);
              if (notifTimer.current) clearTimeout(notifTimer.current);
            }}
            style={{ padding: 4 }}
          >
            <Text style={{ color: '#bbf7d0', fontSize: 16, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={() => load(currentPage)}
        className="flex-row items-center justify-end mb-3"
      >
        <Text className="text-red-600 text-sm font-medium">↻ Refresh</Text>
      </TouchableOpacity>

      {!page || page.content.length === 0 ? (
        <View className="items-center py-16">
          <Text className="text-5xl mb-3">📅</Text>
          <Text className="text-gray-700 font-semibold text-base mb-1">No Bookings Yet</Text>
          <Text className="text-gray-400 text-sm text-center px-8">
            Switch to "Book a Table" above to make your first reservation.
          </Text>
        </View>
      ) : (
        <>
          <View className="gap-3 mb-4">
            {page.content.map(booking => (
              <View
                key={booking.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
                style={{ borderWidth: 1, borderColor: '#f3f4f6' }}
              >
                <View
                  style={{
                    height: 4,
                    backgroundColor: BOOKING_STATUS_COLORS[booking.status],
                  }}
                />
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                      <Text className="text-2xl">
                        {TABLE_FLOOR_ICONS[booking.tableFloor]}
                      </Text>
                      <View>
                        <Text className="font-semibold text-gray-900">
                          Table {booking.tableNumber}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {TABLE_FLOOR_LABELS[booking.tableFloor]} · #{booking.id}
                        </Text>
                      </View>
                    </View>
                    <View
                      className="px-2.5 py-1 rounded-full"
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

                  <View className="flex-row gap-4 mb-3">
                    <Text className="text-gray-500 text-xs">📅 {booking.bookingDate}</Text>
                    <Text className="text-gray-500 text-xs">
                      🕐 {booking.startTime.slice(0, 5)}–{booking.endTime.slice(0, 5)}
                    </Text>
                    <Text className="text-gray-500 text-xs">👥 {booking.partySize}</Text>
                  </View>

                  {booking.specialRequests && (
                    <Text className="text-xs text-gray-500 italic bg-gray-50 rounded-xl px-3 py-2 mb-3">
                      "{booking.specialRequests}"
                    </Text>
                  )}

                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <TouchableOpacity
                      onPress={() => handleCancel(booking)}
                      disabled={cancellingId === booking.id}
                      className="bg-red-50 rounded-xl py-2.5 items-center"
                    >
                      {cancellingId === booking.id ? (
                        <ActivityIndicator color="#dc2626" size="small" />
                      ) : (
                        <Text className="text-red-600 text-sm font-semibold">Cancel Booking</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {page.totalPages > 1 && (
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                disabled={page.first}
                onPress={() => setCurrentPage(p => p - 1)}
                className={`px-4 py-2 rounded-xl ${page.first ? 'bg-gray-100' : 'bg-red-100'}`}
              >
                <Text className={page.first ? 'text-gray-400' : 'text-red-600'}>← Prev</Text>
              </TouchableOpacity>
              <Text className="text-gray-500 text-sm">
                {page.pageNumber + 1} / {page.totalPages}
              </Text>
              <TouchableOpacity
                disabled={page.last}
                onPress={() => setCurrentPage(p => p + 1)}
                className={`px-4 py-2 rounded-xl ${page.last ? 'bg-gray-100' : 'bg-red-100'}`}
              >
                <Text className={page.last ? 'text-gray-400' : 'text-red-600'}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
