import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2,
  XCircle,
  Bell,
  ExternalLink,
  Banknote,
} from 'lucide-react';
import { orderService } from '../../services/order.service';
import { billingService } from '../../services/billing.service';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import type { Order, OrderStatus, PaymentStatus } from '../../types/menu.types';

// ── Status config ─────────────────────────────────────────────────────────────

const ORDER_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Order Placed',   color: 'text-yellow-700',  bg: 'bg-yellow-100',  icon: <Clock size={13} /> },
  CONFIRMED: { label: 'Confirmed',      color: 'text-blue-700',    bg: 'bg-blue-100',    icon: <CheckCircle2 size={13} /> },
  PREPARING: { label: 'Being Cooked',   color: 'text-orange-700',  bg: 'bg-orange-100',  icon: <Flame size={13} /> },
  READY:     { label: 'Ready to Serve', color: 'text-purple-700',  bg: 'bg-purple-100',  icon: <Bell size={13} /> },
  SERVED:    { label: 'Served',         color: 'text-green-700',   bg: 'bg-green-100',   icon: <UtensilsCrossed size={13} /> },
  CANCELLED: { label: 'Cancelled',      color: 'text-red-700',     bg: 'bg-red-100',     icon: <XCircle size={13} /> },
};

const PAYMENT_META: Record<PaymentStatus, { label: string; color: string }> = {
  UNPAID:   { label: 'Unpaid',   color: 'text-red-600' },
  PAID:     { label: 'Paid',     color: 'text-green-600' },
  REFUNDED: { label: 'Refunded', color: 'text-gray-500' },
};

// ── Progress stepper ──────────────────────────────────────────────────────────

function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return null;
  const currentIdx = ORDER_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0 mt-3 mb-1">
      {ORDER_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const meta = STATUS_META[step];
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : active
                    ? `${meta.bg} border-current ${meta.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                {done ? <CheckCircle2 size={14} /> : meta.icon}
              </div>
              <p className={`text-[10px] mt-1 text-center leading-tight w-12 ${active ? meta.color + ' font-semibold' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {meta.label}
              </p>
            </div>
            {i < ORDER_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 rounded ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ order, defaultOpen }: { order: Order; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? (order.status !== 'SERVED' && order.status !== 'CANCELLED'));
  const [khaltiLoading, setKhaltiLoading] = useState(false);
  const [khaltiError, setKhaltiError] = useState('');
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError, setCashError] = useState('');
  const [cashRequested, setCashRequested] = useState(order.cashRequested ?? false);
  const meta = STATUS_META[order.status];
  const payMeta = PAYMENT_META[order.paymentStatus];
  const isActive = !['SERVED', 'CANCELLED'].includes(order.status);
  const canPayWithKhalti = order.status === 'SERVED' && order.paymentStatus === 'UNPAID';

  const handleKhaltiPay = async () => {
    setKhaltiLoading(true);
    setKhaltiError('');
    try {
      const res = await billingService.customerInitiateKhaltiPayment(order.id);
      window.location.href = res.paymentUrl;
    } catch (e: any) {
      const raw = e?.response?.data?.message || e?.message || '';
      // Strip any HTML tags from error messages (e.g. Khalti 503 HTML responses)
      const clean = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const status = e?.response?.status;
      if (status === 503 || clean.toLowerCase().includes('503') || clean.toLowerCase().includes('unavailable')) {
        setKhaltiError('Khalti sandbox is currently down. Please try again later or pay with cash.');
      } else {
        setKhaltiError(clean || 'Could not connect to Khalti. Please try again or pay with cash.');
      }
    } finally {
      setKhaltiLoading(false);
    }
  };

  const handleCashPay = async () => {
    setCashLoading(true);
    setCashError('');
    setKhaltiError(''); // clear any previous khalti error
    try {
      await billingService.requestCashPayment(order.id);
      setCashRequested(true);
    } catch (e: any) {
      setCashError(e?.response?.data?.message || 'Failed to request cash payment. Please ask a staff member.');
    } finally {
      setCashLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isActive ? 'border-orange-200' : 'border-gray-100'
    }`}>
      {/* Colored top strip */}
      <div className={`h-1 ${
        order.status === 'PREPARING' ? 'bg-gradient-to-r from-orange-400 to-red-400' :
        order.status === 'READY'     ? 'bg-purple-400' :
        order.status === 'SERVED'    ? 'bg-green-400' :
        order.status === 'CONFIRMED' ? 'bg-blue-400' :
        order.status === 'CANCELLED' ? 'bg-gray-300' :
        'bg-yellow-400'
      }`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
              <span className={meta.color}>{meta.icon}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Order #{order.id}</p>
              <p className="text-xs text-gray-500">
                Table {order.tableNumber} · {new Date(order.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
            <button onClick={() => setOpen(o => !o)} className="p-1 rounded-lg hover:bg-gray-100 transition">
              {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Progress stepper */}
        {isActive && <OrderStepper status={order.status} />}

        {/* Expanded items */}
        {open && (
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-50 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-gray-700">{item.menuItemName}</span>
                  {item.specialInstructions && (
                    <span className="text-xs text-gray-400 italic">({item.specialInstructions})</span>
                  )}
                </div>
                <span className="text-gray-800 font-medium text-xs shrink-0">NPR {item.lineTotal.toFixed(0)}</span>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>NPR {order.subtotal.toFixed(0)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tax</span><span>NPR {order.taxAmount.toFixed(0)}</span>
                </div>
              )}
              {order.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Service Charge</span><span>NPR {order.serviceChargeAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
                <span>Total</span><span>NPR {order.totalAmount.toFixed(0)}</span>
              </div>
            </div>

            {/* Payment status */}
            <div className="flex items-center gap-2 pt-1">
              <CreditCard size={13} className="text-gray-400" />
              <span className={`text-xs font-semibold ${payMeta.color}`}>{payMeta.label}</span>
            </div>

            {/* Payment buttons — shown when order is served and unpaid */}
            {canPayWithKhalti && (
              <div className="pt-1 space-y-2">
                {khaltiError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{khaltiError}</p>
                )}
                <button
                  onClick={handleKhaltiPay}
                  disabled={khaltiLoading || cashLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                  {khaltiLoading ? 'Opening Khalti...' : <><ExternalLink size={14} /> Pay with Khalti — NPR {order.totalAmount.toFixed(0)}</>}
                </button>
                {cashError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{cashError}</p>
                )}
                {cashRequested ? (
                  <div className="w-full py-3 bg-green-50 border border-green-300 rounded-xl flex items-center justify-center gap-2 text-sm text-green-700 font-semibold">
                    <Banknote size={14} />
                    Cash requested — waiting for staff to confirm
                  </div>
                ) : (
                  <button
                    onClick={handleCashPay}
                    disabled={cashLoading || khaltiLoading}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
                  >
                    {cashLoading ? 'Requesting...' : <><Banknote size={14} /> Pay with Cash — NPR {order.totalAmount.toFixed(0)}</>}
                  </button>
                )}
              </div>
            )}

            {order.notes && (
              <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">
                Note: "{order.notes}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveUpdate, setLiveUpdate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getMyOrders();
      // Most recent first
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setError('Failed to load your orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live updates via WebSocket
  useOrderSocket(update => {
    setOrders(prev =>
      prev.map(o =>
        o.id === update.orderId
          ? { ...o, status: update.status as OrderStatus, paymentStatus: update.paymentStatus as PaymentStatus }
          : o
      )
    );
    const meta = STATUS_META[update.status as OrderStatus];
    if (meta) {
      setLiveUpdate(`Order #${update.orderId} is now ${meta.label}`);
      setTimeout(() => setLiveUpdate(null), 5000);
    }
  });

  const activeOrders = orders.filter(o => !['SERVED', 'CANCELLED'].includes(o.status));
  const pastOrders   = orders.filter(o =>  ['SERVED', 'CANCELLED'].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">My Orders</h1>
              <p className="text-xs text-gray-500">Track your food orders live</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Live update toast */}
        {liveUpdate && (
          <div className="flex items-center gap-3 p-3 bg-orange-500 text-white rounded-xl shadow-lg animate-fade-up">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <p className="text-sm font-medium">{liveUpdate}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <ShoppingBag size={40} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              You haven't placed any orders yet. Scan a table QR or pre-order from a booking.
            </p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition"
            >
              View My Bookings
            </button>
          </div>
        ) : (
          <>
            {/* Active orders */}
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  Active Orders
                  <span className="ml-1 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {activeOrders.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {activeOrders.map(order => (
                    <OrderCard key={order.id} order={order} defaultOpen />
                  ))}
                </div>
              </section>
            )}

            {/* Past orders */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  Past Orders
                </h2>
                <div className="space-y-3">
                  {pastOrders.map(order => (
                    <OrderCard key={order.id} order={order} defaultOpen={false} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
