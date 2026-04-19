import { useCallback, useEffect, useMemo, useState } from 'react';
import { tableService } from '../../services/table.service';
import { realtimeService, type BookingRealtimeEvent } from '../../services/realtime.service.ts';
import { TABLE_FLOOR_LABELS, type BookingItem } from '../../types/table.types';

const NOTICE_KEY = 'tableBookingNotice';
const NOTICE_FALLBACK = 'Table has been booked or reserved.';

type AdminTable = {
  id: number;
  tableNumber: number;
  tableFloor: keyof typeof TABLE_FLOOR_LABELS;
};

const AdminTablesPage = () => {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const bc = useMemo(
    () => (typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('table-booking-channel') : null),
    []
  );

  const pushNotice = useCallback(
    (msg?: string) => {
      const text = msg || NOTICE_FALLBACK;
      setNotice(text);
      sessionStorage.setItem(NOTICE_KEY, text);
      window.dispatchEvent(new CustomEvent('table-booked', { detail: { message: text } }));
      bc?.postMessage({ type: 'table-booked', message: text });
    },
    [bc]
  );

  const loadTables = useCallback(async () => {
    setIsLoadingTables(true);
    setTablesError(null);
    try {
      const svc = tableService as unknown as Record<string, () => Promise<unknown>>;
      const fn = svc.getAllTables ?? svc.getTables ?? svc.listTables;

      if (!fn) {
        setTablesError('Table list API method not found in tableService.');
        setTables([]);
        return;
      }

      const raw = await fn();
      const list = Array.isArray(raw)
        ? raw
        : (raw as { content?: unknown[] })?.content && Array.isArray((raw as { content?: unknown[] }).content)
        ? (raw as { content: unknown[] }).content
        : [];

      const normalized: AdminTable[] = list
        .map(item => item as Record<string, unknown>)
        .filter(item => typeof item.id === 'number' && (typeof item.tableNumber === 'string' || typeof item.tableNumber === 'number'))
        .map(item => ({
          id: item.id as number,
          tableNumber: item.tableNumber as number,
          tableFloor: ((item.floor ?? item.tableFloor ?? 'INDOOR') as keyof typeof TABLE_FLOOR_LABELS),
        }));

      setTables(normalized);
    } catch {
      setTablesError('Failed to load tables.');
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  }, []);

  const loadTableDetails = useCallback(async (tableId: number) => {
    setIsLoadingDetails(true);
    try {
      const booking = await tableService.getTableBookingDetails(tableId);
      setSelectedBooking(booking);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    const stored = sessionStorage.getItem(NOTICE_KEY);
    if (stored) setNotice(stored);

    const onBooked = (e: Event) => {
      const ce = e as CustomEvent<{ message?: string }>;
      setNotice(ce.detail?.message ?? NOTICE_FALLBACK);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === NOTICE_KEY && e.newValue) setNotice(e.newValue);
    };

    const onBC = (e: MessageEvent<{ type?: string; message?: string }>) => {
      if (e.data?.type === 'table-booked') setNotice(e.data.message ?? NOTICE_FALLBACK);
    };

    window.addEventListener('table-booked', onBooked as EventListener);
    window.addEventListener('storage', onStorage);
    bc?.addEventListener('message', onBC);

    return () => {
      window.removeEventListener('table-booked', onBooked as EventListener);
      window.removeEventListener('storage', onStorage);
      bc?.removeEventListener('message', onBC);
      bc?.close();
    };
  }, [bc]);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeBookingEvents((event: BookingRealtimeEvent) => {
      if (event.type === 'BOOKED' || event.type === 'RESERVED') {
        pushNotice(event.message ?? NOTICE_FALLBACK);
        loadTables();
      }

      if (selectedTableId && event.tableId === selectedTableId) {
        loadTableDetails(selectedTableId);
      }
    });

    return unsubscribe;
  }, [selectedTableId, loadTableDetails, pushNotice, loadTables]);

  const handleTableClick = async (tableId: number) => {
    setSelectedTableId(tableId);
    await loadTableDetails(tableId);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Tables Page</h2>

      {notice && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          {notice}
        </div>
      )}

      {tablesError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {tablesError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {isLoadingTables ? (
          <p className="text-sm text-gray-500">Loading tables...</p>
        ) : tables.length === 0 ? (
          <p className="text-sm text-gray-500">No tables available.</p>
        ) : (
          tables.map(table => (
            <div key={table.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-gray-900">Table {table.tableNumber}</p>
              <p className="text-xs text-gray-500 mb-3">
                {TABLE_FLOOR_LABELS[table.tableFloor] ?? String(table.tableFloor)}
              </p>

              <button
                type="button"
                onClick={() => handleTableClick(table.id)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
              >
                View Table Details
              </button>
            </div>
          ))
        )}
      </div>

      {selectedTableId && (
        <div className="mt-4 bg-white border rounded-xl p-4">
          <h3 className="font-semibold mb-2">Table #{selectedTableId} Booking Details</h3>
          {isLoadingDetails ? (
            <p className="text-sm text-gray-500">Loading details...</p>
          ) : !selectedBooking ? (
            <p className="text-sm text-gray-500">No active booking for this table.</p>
          ) : (
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Booked By:</span> {selectedBooking.userFullName}</p>
              <p><span className="font-medium">Email:</span> {selectedBooking.userEmail ?? '-'}</p>
              <p><span className="font-medium">Date:</span> {selectedBooking.bookingDate}</p>
              <p><span className="font-medium">Time:</span> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
              <p><span className="font-medium">Party Size:</span> {selectedBooking.partySize}</p>
              <p><span className="font-medium">Status:</span> {selectedBooking.status}</p>
              {selectedBooking.specialRequests && (
                <p><span className="font-medium">Special Requests:</span> {selectedBooking.specialRequests}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTablesPage;