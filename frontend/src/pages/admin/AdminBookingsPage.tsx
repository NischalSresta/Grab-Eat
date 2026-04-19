import { useState, useEffect, useCallback } from 'react';
import { tableService } from '../../services/table.service';
import { orderService } from '../../services/order.service';
import type { BookingItem } from '../../types/table.types';
import type { Order } from '../../types/menu.types';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, TABLE_FLOOR_LABELS } from '../../types/table.types';
import {
  CheckCircle, XCircle, RefreshCw, Calendar, Clock, Users, CheckCheck, Inbox,
  ShoppingBag, ChevronDown, ChevronUp, CreditCard, UtensilsCrossed,
} from 'lucide-react';

type StatusFilter = 'REQUESTS' | 'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'REQUESTS', label: 'Booking Requests' },
  { key: 'ALL',      label: 'All Bookings'     },
  { key: 'CONFIRMED', label: 'Confirmed'        },
  { key: 'COMPLETED', label: 'Completed'        },
  { key: 'CANCELLED', label: 'Cancelled'        },
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY:     'bg-purple-100 text-purple-800',
  SERVED:    'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PAYMENT_COLORS: Record<string, string> = {
  UNPAID:   'bg-red-100 text-red-700',
  PAID:     'bg-green-100 text-green-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

function BookingOrdersPanel({ tableId }: { tableId: number }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    orderService.getOrdersByTable(tableId)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [tableId]);

  if (loading) {
    return <p className="text-xs text-gray-400 py-2">Loading orders...</p>;
  }

  if (!orders || orders.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-2 flex items-center gap-1.5">
        <ShoppingBag size={12} /> No pre-orders placed for this table yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div key={order.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={13} className="text-orange-500" />
              <span className="text-xs font-semibold text-gray-800">Order #{order.id}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{order.customerName || 'Guest'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {order.status}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                <CreditCard size={10} className="inline mr-1" />
                {order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-xs text-gray-600 py-1">
                <span>{item.menuItemName} × {item.quantity}</span>
                <span className="text-gray-800 font-medium">NPR {item.lineTotal.toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-900">NPR {order.totalAmount.toFixed(0)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusFilter>('REQUESTS');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState<number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await tableService.adminGetAllBookings(0, 200);
      setBookings(page.content);
    } catch {
      setError('Failed to load bookings. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 20 s so new requests appear
  useEffect(() => {
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const confirmBooking = async (id: number) => {
    setActionLoading(id);
    try {
      const updated = await tableService.adminConfirmBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: updated.status } : b));
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2500);
    } catch { setError('Failed to confirm booking.'); }
    finally { setActionLoading(null); }
  };

  const cancelBooking = async (id: number) => {
    setActionLoading(id);
    try {
      const updated = await tableService.adminCancelBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: updated.status } : b));
    } catch { setError('Failed to cancel booking.'); }
    finally { setActionLoading(null); }
  };

  const completeBooking = async (id: number) => {
    setActionLoading(id);
    try {
      const updated = await tableService.adminCompleteBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: updated.status } : b));
    } catch { setError('Failed to mark booking complete.'); }
    finally { setActionLoading(null); }
  };

  const toggleOrders = (bookingId: number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  };

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

  const filtered = bookings.filter(b => {
    const matchTab =
      tab === 'REQUESTS' ? b.status === 'PENDING' :
      tab === 'ALL'      ? true :
      b.status === tab;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.userFullName?.toLowerCase().includes(q) ||
      String(b.tableNumber).includes(q) ||
      String(b.id).includes(q) ||
      b.userEmail?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-6 space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-gradient">Booking Management</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review customer reservations and confirm or cancel them
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.key === 'REQUESTS' && pendingCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email, table number or booking ID..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
          <Inbox size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 font-medium">
            {tab === 'REQUESTS' ? 'No pending booking requests.' : 'No bookings found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const isPending   = booking.status === 'PENDING';
            const isConfirmed = booking.status === 'CONFIRMED';
            const isSuccess   = successId === booking.id;
            const ordersOpen  = expandedOrders.has(booking.id);

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isPending
                    ? 'border-orange-200 shadow-sm shadow-orange-50'
                    : isSuccess
                    ? 'border-green-200'
                    : 'border-gray-100'
                }`}
              >
                {/* Top status bar */}
                {isPending && (
                  <div className="h-1 rounded-t-2xl bg-gradient-to-r from-orange-400 to-orange-500" />
                )}
                {isSuccess && (
                  <div className="h-1 rounded-t-2xl bg-green-400" />
                )}

                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
                  {/* Info grid */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Booking ID</p>
                      <p className="font-bold text-gray-800">#{booking.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                      <p className="font-semibold text-gray-800 truncate">{booking.userFullName}</p>
                      <p className="text-xs text-gray-400 truncate">{booking.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                        <Calendar size={10} /> Date & Time
                      </p>
                      <p className="font-medium text-gray-700">{formatDate(booking.bookingDate)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {booking.startTime?.slice(0, 5)} – {booking.endTime?.slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                        <Users size={10} /> Table & Guests
                      </p>
                      <p className="font-medium text-gray-700">
                        Table {booking.tableNumber}
                        {booking.tableFloor && ` · ${TABLE_FLOOR_LABELS[booking.tableFloor]}`}
                      </p>
                      <p className="text-xs text-gray-500">{booking.partySize} {booking.partySize === 1 ? 'guest' : 'guests'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {isSuccess ? (
                      <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                        <CheckCheck size={16} /> Confirmed!
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BOOKING_STATUS_COLORS[booking.status]}`}>
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                    )}

                    {isPending && (
                      <>
                        <button
                          onClick={() => confirmBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50 shadow-sm"
                        >
                          <CheckCircle size={15} />
                          {actionLoading === booking.id ? 'Confirming...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <XCircle size={15} /> Decline
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        <button
                          onClick={() => completeBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 shadow-sm"
                        >
                          <CheckCheck size={15} />
                          {actionLoading === booking.id ? 'Saving...' : 'Mark Complete'}
                        </button>
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <XCircle size={15} /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {booking.specialRequests && (
                  <div className="px-5 pb-2">
                    <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">
                      Note: "{booking.specialRequests}"
                    </p>
                  </div>
                )}

                {/* Pre-orders toggle */}
                <div className="px-5 pb-4">
                  <button
                    onClick={() => toggleOrders(booking.id)}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium transition"
                  >
                    <ShoppingBag size={13} />
                    {ordersOpen ? 'Hide' : 'View'} Pre-orders
                    {ordersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {ordersOpen && (
                    <div className="mt-3">
                      <BookingOrdersPanel tableId={booking.tableId} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
