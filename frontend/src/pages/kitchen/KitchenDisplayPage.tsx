import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../services/order.service';
import { billingService } from '../../services/billing.service';
import type { Order, OrderStatus } from '../../types/menu.types';
import type { PaymentMethod } from '../../types/billing.types';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import {
  CheckCircle, Clock, ChefHat, Bell, Utensils,
  Banknote, CreditCard, X, RefreshCw, ExternalLink,
} from 'lucide-react';

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_BORDER: Record<OrderStatus, string> = {
  PENDING:   'border-yellow-400',
  CONFIRMED: 'border-blue-400',
  PREPARING: 'border-orange-400',
  READY:     'border-green-400',
  SERVED:    'border-emerald-500',
  CANCELLED: 'border-red-300',
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY:     'bg-green-100 text-green-800',
  SERVED:    'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-600',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING:   'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY:     'SERVED',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING:   'Confirm Order',
  CONFIRMED: 'Start Cooking',
  PREPARING: 'Mark Ready',
  READY:     'Mark Served ✓',
};

const NEXT_BUTTON_COLOR: Partial<Record<OrderStatus, string>> = {
  PENDING:   'bg-blue-500 hover:bg-blue-600',
  CONFIRMED: 'bg-orange-500 hover:bg-orange-600',
  PREPARING: 'bg-green-500 hover:bg-green-600',
  READY:     'bg-emerald-500 hover:bg-emerald-600',
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH',   label: 'Cash',   icon: Banknote     },
  { value: 'CARD',   label: 'Card',   icon: CreditCard   },
  { value: 'KHALTI', label: 'Khalti', icon: ExternalLink  },
];

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

interface PaymentModalProps {
  order: Order;
  onClose: () => void;
  onPaid: (orderId: number) => void;
}

function PaymentModal({ order, onClose, onPaid }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setProcessing(true);
    setError('');
    try {
      if (method === 'KHALTI') {
        const res = await billingService.initiateKhaltiPayment(order.id);
        window.open(res.paymentUrl, '_blank', 'noopener,noreferrer');
        // Don't call onPaid yet — payment is confirmed via callback
        setError('');
      } else {
        await billingService.processPayment(order.id, { paymentMethod: method });
        onPaid(order.id);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Collect Payment</h2>
            <p className="text-sm text-gray-500">Order #{order.id} · Table {order.tableNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Bill items */}
        <div className="px-5 py-4 max-h-48 overflow-y-auto space-y-1.5">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}× {item.menuItemName}</span>
              <span className="text-gray-500">NPR {item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>NPR {order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Tax (13%)</span><span>NPR {order.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Service (10%)</span><span>NPR {order.serviceChargeAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2 mt-1">
            <span>Total</span>
            <span className="text-orange-600 text-lg">NPR {order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="px-5 pb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(pm => {
              const Icon = pm.icon;
              const isSelected = method === pm.value;
              return (
                <button
                  key={pm.value}
                  onClick={() => setMethod(pm.value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition ${
                    isSelected
                      ? pm.value === 'KHALTI'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  <Icon size={18} />
                  {pm.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="mx-5 mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Confirm button */}
        <div className="px-5 pb-5">
          <button
            onClick={handlePay}
            disabled={processing}
            className={`w-full py-3.5 disabled:opacity-60 text-white font-bold rounded-xl transition text-base flex items-center justify-center gap-2 ${
              method === 'KHALTI'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {processing
              ? 'Processing...'
              : method === 'KHALTI'
                ? <><ExternalLink size={16} /> Open Khalti · NPR {order.totalAmount.toFixed(2)}</>
                : `Confirm Payment · NPR ${order.totalAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  updating: boolean;
  onAdvance: (order: Order) => void;
  onCancel: (orderId: number) => void;
  onCollectPayment?: (order: Order) => void;
  isPaymentCard?: boolean;
}

function OrderCard({ order, updating, onAdvance, onCancel, onCollectPayment, isPaymentCard }: OrderCardProps) {
  const nextStatus = NEXT_STATUS[order.status];

  if (isPaymentCard) {
    return (
      <div className="bg-white rounded-2xl border-2 border-emerald-400 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-emerald-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600" />
            <div>
              <span className="font-bold text-gray-800 text-sm">Table {order.tableNumber}</span>
              <span className="text-gray-400 text-xs ml-2">#{order.id}</span>
            </div>
          </div>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            Served ✓
          </span>
        </div>

        <div className="px-4 py-3 space-y-1">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                {item.quantity}
              </span>
              <span className="text-gray-700">{item.menuItemName}</span>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <div className="bg-orange-50 rounded-xl p-3 mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Amount Due</span>
            <span className="text-xl font-extrabold text-orange-600">NPR {order.totalAmount.toFixed(2)}</span>
          </div>
          <button
            onClick={() => onCollectPayment?.(order)}
            disabled={updating}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition text-sm"
          >
            Collect Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border-2 ${STATUS_BORDER[order.status]} overflow-hidden shadow-sm`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <div>
          <span className="font-bold text-gray-800">#{order.id}</span>
          <span className="text-gray-500 text-sm ml-2">Table {order.tableNumber}</span>
          {order.customerName && (
            <span className="text-gray-400 text-xs ml-1">· {order.customerName}</span>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.items.map(item => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              {item.quantity}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.menuItemName}</p>
              {item.specialInstructions && (
                <p className="text-xs text-orange-600 italic">{item.specialInstructions}</p>
              )}
            </div>
          </div>
        ))}
        {order.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
            <p className="text-xs text-yellow-700">📝 {order.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onCancel(order.id)}
            disabled={updating}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
          >
            Cancel
          </button>
          {nextStatus && (
            <button
              onClick={() => onAdvance(order)}
              disabled={updating}
              className={`text-xs px-3 py-1.5 rounded-lg text-white font-semibold transition disabled:opacity-50 ${NEXT_BUTTON_COLOR[order.status] || 'bg-gray-500'}`}
            >
              {updating ? '...' : NEXT_LABEL[order.status]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status icon lookup for tabs ──────────────────────────────────────────────
const STATUS_ICONS: Partial<Record<OrderStatus | 'ALL', React.ElementType>> = {
  ALL:       Utensils,
  PENDING:   Clock,
  CONFIRMED: CheckCircle,
  PREPARING: ChefHat,
  READY:     Bell,
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KitchenDisplayPage() {
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');
  const [view, setView] = useState<'kitchen' | 'payment'>('kitchen');

  const fetchAll = useCallback(async () => {
    try {
      const [active, served] = await Promise.all([
        orderService.getActiveOrders(),
        orderService.getOrdersByStatus('SERVED'),
      ]);
      setKitchenOrders(active.filter(o => o.status !== 'SERVED'));
      setPaymentOrders(served.filter(o => o.paymentStatus === 'UNPAID'));
    } catch {
      // silent fail on background refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useOrderSocket(useCallback((update) => {
    if (update.status === 'SERVED') {
      setKitchenOrders(prev => prev.filter(o => o.id !== update.orderId));
      fetchAll(); // re-fetch served list
    } else if (update.status === 'CANCELLED') {
      setKitchenOrders(prev => prev.filter(o => o.id !== update.orderId));
      setPaymentOrders(prev => prev.filter(o => o.id !== update.orderId));
    } else if (update.paymentStatus === 'PAID') {
      setPaymentOrders(prev => prev.filter(o => o.id !== update.orderId));
    } else {
      fetchAll();
    }
  }, [fetchAll]));

  const handleAdvance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      const updated = await orderService.updateOrderStatus(order.id, next);
      if (next === 'SERVED') {
        setKitchenOrders(prev => prev.filter(o => o.id !== order.id));
        setPaymentOrders(prev => [updated, ...prev]);
        setView('payment');
      } else {
        setKitchenOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm('Cancel this order?')) return;
    setUpdatingId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      setKitchenOrders(prev => prev.filter(o => o.id !== orderId));
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaid = (orderId: number) => {
    setPaymentOrders(prev => prev.filter(o => o.id !== orderId));
    setPaymentOrder(null);
    const order = paymentOrders.find(o => o.id === orderId);
    setPaySuccessMsg(`Table ${order?.tableNumber} payment received ✓`);
    setTimeout(() => setPaySuccessMsg(''), 4000);
  };

  const filtered = filter === 'ALL'
    ? kitchenOrders
    : kitchenOrders.filter(o => o.status === filter);

  const counts: Partial<Record<OrderStatus, number>> = {};
  kitchenOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Staff Orders</h1>
            <p className="text-gray-400 text-xs">
              {kitchenOrders.length} active · {paymentOrders.length} awaiting payment
            </p>
          </div>
          <button
            onClick={fetchAll}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* View tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('kitchen')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              view === 'kitchen' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Kitchen
            {kitchenOrders.length > 0 && (
              <span className="ml-2 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                {kitchenOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('payment')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition relative ${
              view === 'payment' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Awaiting Payment
            {paymentOrders.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                view === 'payment' ? 'bg-white/20 text-white' : 'bg-orange-500 text-white animate-pulse'
              }`}>
                {paymentOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Success toast ──────────────────────────────────────────────────── */}
      {paySuccessMsg && (
        <div className="mx-4 mt-4 bg-emerald-600 text-white rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={16} /> {paySuccessMsg}
        </div>
      )}

      <div className="p-4">

        {/* ── KITCHEN VIEW ─────────────────────────────────────────────────── */}
        {view === 'kitchen' && (
          <>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY'] as const).map(s => {
                const Icon = STATUS_ICONS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition flex-shrink-0 ${
                      filter === s ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {Icon && <Icon size={12} />}
                    {s === 'ALL' ? `All (${kitchenOrders.length})` : `${s} (${counts[s as OrderStatus] || 0})`}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-5xl mb-4">🍳</div>
                <p className="text-xl font-semibold">No active orders</p>
                <p className="text-sm mt-1 text-gray-600">New orders appear here automatically</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    updating={updatingId === order.id}
                    onAdvance={handleAdvance}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PAYMENT VIEW ─────────────────────────────────────────────────── */}
        {view === 'payment' && (
          <>
            {paymentOrders.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-5xl mb-4">💳</div>
                <p className="text-xl font-semibold">No pending payments</p>
                <p className="text-sm mt-1 text-gray-600">Served orders awaiting payment appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paymentOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    updating={updatingId === order.id}
                    onAdvance={handleAdvance}
                    onCancel={handleCancel}
                    onCollectPayment={setPaymentOrder}
                    isPaymentCard
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Payment Modal ─────────────────────────────────────────────────────── */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}
