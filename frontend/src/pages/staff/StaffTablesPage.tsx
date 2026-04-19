import { useState, useEffect, useCallback } from 'react';
import { tableService } from '../../services/table.service';
import { apiClient } from '../../services/api.service';
import type { TableItem, BookingItem, TableFloor } from '../../types/table.types';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  TABLE_FLOOR_LABELS,
  TABLE_FLOOR_ICONS,
} from '../../types/table.types';
import {
  QrCode, Users, RefreshCw, Printer, X, Calendar, Clock,
  CheckCircle2, UtensilsCrossed, CheckCircle, LayoutGrid, List, Activity,
} from 'lucide-react';
import TableDiagram from '../../components/ui/TableDiagram';

type ViewTab = 'status' | 'diagram' | 'list';

// ─── Floor config ─────────────────────────────────────────────────────────────

const FLOOR_ORDER: TableFloor[] = ['INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE_DINING', 'TERRACE'];

const FLOOR_CONFIG: Record<TableFloor, { label: string; emoji: string; bg: string }> = {
  INDOOR:        { label: 'Indoor',         emoji: '🏠', bg: 'rgba(59,130,246,0.1)'  },
  OUTDOOR:       { label: 'Outdoor',        emoji: '🌳', bg: 'rgba(16,185,129,0.1)'  },
  ROOFTOP:       { label: 'Rooftop',        emoji: '🌅', bg: 'rgba(249,115,22,0.1)'  },
  PRIVATE_DINING:{ label: 'Private Dining', emoji: '🍽️', bg: 'rgba(139,92,246,0.1)' },
  TERRACE:       { label: 'Terrace',        emoji: '☀️', bg: 'rgba(245,158,11,0.1)'  },
};

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function QrModal({ table, onClose }: { table: TableItem; onClose: () => void }) {
  const [qrSrc, setQrSrc]     = useState<string | null>(null);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState('');

  useEffect(() => {
    let url = '';
    apiClient
      .get<Blob>(`/qr/table/${table.id}`, { responseType: 'blob' } as any)
      .then(blob => { url = URL.createObjectURL(blob); setQrSrc(url); })
      .catch(() => setError('Could not load QR code'))
      .finally(() => setLoading(false));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [table.id]);

  const handlePrint = () => {
    if (!qrSrc) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>QR - Table ${table.tableNumber}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px}img{width:280px;height:280px;margin:16px auto;display:block}h2{font-size:22px;margin:0}p{color:#666;margin:4px 0;font-size:14px}</style>
      </head><body><h2>Table ${table.tableNumber}</h2>
      <p>${table.floor.replace('_', ' ')} · Seats ${table.capacity}</p>
      <img src="${qrSrc}" />
      <p style="margin-top:12px;font-size:13px;color:#999">Scan to view menu &amp; order</p>
      <script>window.onload=()=>window.print();</script></body></html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Table {table.tableNumber}</h2>
            <p className="text-xs text-gray-400">{table.floor.replace('_', ' ')} · {table.capacity} seats</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-6 flex flex-col items-center">
          {loading && <div className="w-56 h-56 flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}
          {error  && <div className="w-56 h-56 flex items-center justify-center"><p className="text-red-500 text-sm">{error}</p></div>}
          {qrSrc  && <img src={qrSrc} alt={`QR for Table ${table.tableNumber}`} className="w-56 h-56 rounded-xl border border-gray-100 shadow-sm" />}
          <p className="text-sm text-gray-500 mt-4 text-center">Show this to the customer so they can scan to order.</p>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={handlePrint} disabled={!qrSrc}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
            <Printer size={15} /> Print
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reservation Card ─────────────────────────────────────────────────────────

interface ReservationCardProps {
  table: TableItem;
  booking: BookingItem | undefined;
  lastBooking?: BookingItem;
  actionLoading: number | null;
  onAction: (action: 'confirm' | 'complete' | 'cancel', bookingId: number) => void;
  onShowQr: (table: TableItem) => void;
  onResetTable: (tableId: number) => void;
}

function ReservationCard({ table, booking, lastBooking, actionLoading, onAction, onShowQr, onResetTable }: ReservationCardProps) {
  const isConfirmed = booking?.status === 'CONFIRMED';

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
      isConfirmed ? 'border-green-200' : booking ? 'border-amber-200' : 'border-red-200'
    }`}>
      {/* Top strip */}
      <div className={`h-1 ${isConfirmed ? 'bg-green-400' : booking ? 'bg-amber-400' : 'bg-red-400'}`} />

      <div className="p-4">
        {/* Table identity */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed size={15} className="text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Table {table.tableNumber}</p>
              <p className="text-xs text-gray-400">{table.capacity} seats</p>
            </div>
          </div>
          {booking ? (
            <span className={`text-[11px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ${BOOKING_STATUS_COLORS[booking.status]}`}>
              {BOOKING_STATUS_LABELS[booking.status]}
            </span>
          ) : (
            <span className="text-[11px] px-2 py-1 rounded-full font-semibold bg-red-100 text-red-700 flex-shrink-0">
              Occupied
            </span>
          )}
        </div>

        {booking ? (
          <>
            {/* Customer info */}
            <div className={`flex items-center gap-2.5 p-3 rounded-xl mb-3 ${isConfirmed ? 'bg-green-50' : 'bg-amber-50'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                isConfirmed ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
              }`}>
                {booking.userFullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{booking.userFullName}</p>
                <p className="text-xs text-gray-500 truncate">{booking.userEmail}</p>
              </div>
            </div>

            {/* Booking details */}
            <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
              <div className="bg-gray-50 rounded-lg py-2 px-1">
                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                  <Calendar size={9} className="text-gray-400" />
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Date</p>
                </div>
                <p className="text-[11px] font-bold text-gray-800 leading-tight">{booking.bookingDate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-2 px-1">
                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                  <Clock size={9} className="text-gray-400" />
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Time</p>
                </div>
                <p className="text-[11px] font-bold text-gray-800 leading-tight">{booking.startTime.slice(0,5)}–{booking.endTime.slice(0,5)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-2 px-1">
                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                  <Users size={9} className="text-gray-400" />
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Party</p>
                </div>
                <p className="text-[11px] font-bold text-gray-800 leading-tight">{booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}</p>
              </div>
            </div>

            {booking.specialRequests && (
              <p className="text-xs text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2 mb-3 truncate">
                💬 "{booking.specialRequests}"
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => onShowQr(table)}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                <QrCode size={11} /> QR
              </button>
              {booking.status === 'PENDING' && (
                <>
                  <button onClick={() => onAction('confirm', booking.id)} disabled={actionLoading === booking.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition">
                    <CheckCircle2 size={11} /> Confirm
                  </button>
                  <button onClick={() => onAction('cancel', booking.id)} disabled={actionLoading === booking.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition">
                    <X size={11} /> Decline
                  </button>
                </>
              )}
              {booking.status === 'CONFIRMED' && (
                <>
                  <button onClick={() => onAction('complete', booking.id)} disabled={actionLoading === booking.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition">
                    <CheckCircle size={11} /> Complete
                  </button>
                  <button onClick={() => onAction('cancel', booking.id)} disabled={actionLoading === booking.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition">
                    <X size={11} /> Cancel
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div>
            {lastBooking ? (
              <>
                {/* Last completed/cancelled booking info */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {lastBooking.userFullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-700 text-sm truncate">{lastBooking.userFullName}</p>
                    <p className="text-xs text-gray-400 truncate">{lastBooking.userEmail}</p>
                  </div>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-semibold flex-shrink-0">
                    {lastBooking.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                  <div className="bg-gray-50 rounded-lg py-2 px-1">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Date</p>
                    <p className="text-[11px] font-bold text-gray-600 leading-tight">{lastBooking.bookingDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2 px-1">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Time</p>
                    <p className="text-[11px] font-bold text-gray-600 leading-tight">{lastBooking.startTime.slice(0,5)}–{lastBooking.endTime.slice(0,5)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2 px-1">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Party</p>
                    <p className="text-[11px] font-bold text-gray-600 leading-tight">{lastBooking.partySize}p</p>
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">
                  Table status not synced — last booking was {lastBooking.status.toLowerCase()}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 py-2 mb-3 text-center">No booking record found</p>
            )}
            <div className="flex gap-1.5">
              <button onClick={() => onShowQr(table)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                <QrCode size={12} /> QR
              </button>
              <button onClick={() => onResetTable(table.id)} disabled={actionLoading === table.id}
                className="flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-200 disabled:opacity-50 transition">
                Mark Available
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffTablesPage() {
  const [tables, setTables]                   = useState<TableItem[]>([]);
  const [activeBookings, setActiveBookings]   = useState<BookingItem[]>([]);
  const [lastBookings, setLastBookings]       = useState<Record<number, BookingItem>>({});
  const [loading, setLoading]                 = useState(true);
  const [viewTab, setViewTab]                 = useState<ViewTab>('status');
  const [qrTable, setQrTable]                 = useState<TableItem | null>(null);
  const [actionLoading, setActionLoading]     = useState<number | null>(null);
  const [successMsg, setSuccessMsg]           = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Use allSettled so a bookings 403 never blocks table loading
      const [tablesResult, bookingsResult] = await Promise.allSettled([
        tableService.getAllTables(),
        tableService.adminGetActiveBookings(),
      ]);

      const tablesData: TableItem[] = tablesResult.status === 'fulfilled' ? tablesResult.value : [];
      const bookingsData: BookingItem[] = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];

      const activeTables = tablesData.filter((t: TableItem) => t.isActive);
      setTables(activeTables);
      setActiveBookings(bookingsData);

      // For OCCUPIED/RESERVED tables with no active booking, fetch their last booking
      const activeBookingTableIds = new Set(bookingsData.map((b: BookingItem) => b.tableId));
      const occupiedWithNoActive = activeTables.filter(
        (t: TableItem) => (t.status === 'OCCUPIED' || t.status === 'RESERVED') && !activeBookingTableIds.has(t.id)
      );
      if (occupiedWithNoActive.length > 0) {
        const results = await Promise.allSettled(
          occupiedWithNoActive.map((t: TableItem) => tableService.adminGetBookingsByTable(t.id))
        );
        const map: Record<number, BookingItem> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value.length > 0) {
            map[occupiedWithNoActive[i].id] = r.value[0];
          }
        });
        setLastBookings(map);
      } else {
        setLastBookings({});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // tableId → best active booking (CONFIRMED preferred over PENDING)
  const bookingByTableId = activeBookings.reduce<Record<number, BookingItem>>((acc, b) => {
    if (!acc[b.tableId] || b.status === 'CONFIRMED') acc[b.tableId] = b;
    return acc;
  }, {});

  const reservedCount   = tables.filter(t => t.status === 'RESERVED' || t.status === 'OCCUPIED').length;
  const availableCount  = tables.filter(t => t.status === 'AVAILABLE').length;

  const handleResetTable = async (tableId: number) => {
    setActionLoading(tableId);
    try {
      await tableService.adminUpdateTable(tableId, { status: 'AVAILABLE' });
      setSuccessMsg('Table reset to Available.');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchAll();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action: 'confirm' | 'complete' | 'cancel', bookingId: number) => {
    setActionLoading(bookingId);
    try {
      if (action === 'confirm')  await tableService.adminConfirmBooking(bookingId);
      else if (action === 'complete') await tableService.adminCompleteBooking(bookingId);
      else await tableService.adminCancelBooking(bookingId);
      setSuccessMsg(
        action === 'confirm' ? 'Booking confirmed.' :
        action === 'complete' ? 'Booking marked complete.' : 'Booking cancelled.'
      );
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchAll();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { label: 'Total Tables',  value: tables.length,     accent: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
    { label: 'Occupied',      value: reservedCount,     accent: '#f97316', bg: 'rgba(249,115,22,0.1)'   },
    { label: 'Available',     value: availableCount,    accent: '#10b981', bg: 'rgba(16,185,129,0.1)'   },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="h-10 w-64 rounded-xl bg-gray-100 animate-pulse mb-2" />
        <div className="h-4 w-48 rounded bg-gray-100 animate-pulse mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-7 animate-fade-up">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Table Management
          </h1>
          <p className="text-sm mt-0.5 text-slate-400">
            Live reservations, floor plan &amp; table list
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 shadow-sm transition"
          title="Refresh"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-up" style={{ animationDelay: '40ms' }}>
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-slate-800">{s.value}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-0.5" style={{ background: s.bg }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-slate-200/70 rounded-xl p-1 w-fit mb-6 animate-fade-up" style={{ animationDelay: '70ms' }}>
        {([
          ['status',  Activity,   'Live Status'],
          ['diagram', LayoutGrid, 'Floor Plan' ],
          ['list',    List,       'All Tables' ],
        ] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setViewTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewTab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}

      {/* ── Live Status ──────────────────────────────────────────────────────── */}
      {viewTab === 'status' && (
        <>
          {tables.filter(t => t.status !== 'MAINTENANCE').length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
              <UtensilsCrossed size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No tables found</p>
              <p className="text-sm text-slate-400 mt-1">Check that the backend is running and tables exist in the database</p>
              <button onClick={fetchAll} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition">
                Try again
              </button>
            </div>
          ) : (
            FLOOR_ORDER.map((floor, floorIdx) => {
              const floorTables = tables.filter(t => t.floor === floor && t.status !== 'MAINTENANCE');
              if (floorTables.length === 0) return null;
              const floorOccupied  = floorTables.filter(t => t.status === 'RESERVED' || t.status === 'OCCUPIED');
              const floorAvailable = floorTables.filter(t => t.status === 'AVAILABLE');
              const cfg = FLOOR_CONFIG[floor];
              return (
                <div key={floor} className="mb-10 animate-fade-up" style={{ animationDelay: `${100 + floorIdx * 60}ms` }}>
                  {/* Floor header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100 bg-white flex-shrink-0">
                      {cfg.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="font-black text-slate-800 text-lg">{cfg.label}</h2>
                        <span className="text-xs text-slate-400 font-medium">
                          {floorOccupied.length} occupied · {floorAvailable.length} free
                        </span>
                      </div>
                      <div className="mt-1.5 h-px bg-slate-200 w-full" />
                    </div>
                  </div>

                  {/* Occupied */}
                  {floorOccupied.length > 0 && (
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Occupied</span>
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{floorOccupied.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {floorOccupied.map(table => (
                          <ReservationCard
                            key={table.id}
                            table={table}
                            booking={bookingByTableId[table.id]}
                            lastBooking={lastBookings[table.id]}
                            actionLoading={actionLoading}
                            onAction={handleAction}
                            onShowQr={setQrTable}
                            onResetTable={handleResetTable}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available */}
                  {floorAvailable.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available</span>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{floorAvailable.length}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {floorAvailable.map(table => (
                          <div key={table.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-bold text-sm text-slate-800">T{table.tableNumber}</p>
                                <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                                  <Users size={10} />
                                  <span className="text-xs">{table.capacity}p</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Free
                              </span>
                            </div>
                            <button
                              onClick={() => setQrTable(table)}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
                            >
                              <QrCode size={11} /> QR Code
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {/* ── Floor Plan ───────────────────────────────────────────────────────── */}
      {viewTab === 'diagram' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-up">
          <TableDiagram
            tables={tables.filter(t => t.status !== 'MAINTENANCE')}
            onTableClick={t => setQrTable(t)}
            showLegend
          />
        </div>
      )}

      {/* ── All Tables List ──────────────────────────────────────────────────── */}
      {viewTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
          {tables.filter(t => t.status !== 'MAINTENANCE').length === 0 ? (
            <div className="text-center py-16">
              <UtensilsCrossed size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No tables found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Table #', 'Floor / Area', 'Capacity', 'Status', 'Description', 'QR'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tables.filter(t => t.status !== 'MAINTENANCE').map(t => {
                    const statusStyles: Record<string, string> = {
                      AVAILABLE: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                      RESERVED:  'bg-blue-50 text-blue-700 border border-blue-100',
                      OCCUPIED:  'bg-orange-50 text-orange-700 border border-orange-100',
                    };
                    const statusLabels: Record<string, string> = {
                      AVAILABLE: 'Available',
                      RESERVED:  'Reserved',
                      OCCUPIED:  'Occupied',
                    };
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-sm">{t.tableNumber}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {TABLE_FLOOR_ICONS[t.floor]} {TABLE_FLOOR_LABELS[t.floor]}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Users size={13} className="text-slate-400" />
                            {t.capacity} seats
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${statusStyles[t.status] ?? 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {statusLabels[t.status] ?? t.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate text-sm">
                          {t.description || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setQrTable(t)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-semibold transition"
                            title="Show QR"
                          >
                            <QrCode size={13} /> QR
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {qrTable && <QrModal table={qrTable} onClose={() => setQrTable(null)} />}
    </div>
  );
}
