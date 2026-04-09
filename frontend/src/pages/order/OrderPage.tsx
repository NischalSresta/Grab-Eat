import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UtensilsCrossed, Star, CheckCircle, Clock, ChefHat, Bell, Utensils,
  ShoppingCart, Minus, Plus, X, Search, CreditCard, CalendarClock,
  Users, MapPin, BadgeCheck, ExternalLink,
} from 'lucide-react';
import { menuService } from '../../services/menu.service';
import { orderService } from '../../services/order.service';
import { billingService } from '../../services/billing.service';
import { tableService } from '../../services/table.service';
import { recommendationService } from '../../services/recommendation.service';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import { useAuth } from '../../hooks/useAuth';
import type { MenuItem, Category, CartItem, TableInfo, Order, OrderStatus, PaymentStatus } from '../../types/menu.types';
import type { TopPick } from '../../types/recommendation.types';
import type { BookingItem } from '../../types/table.types';

// ─── Order status steps ───────────────────────────────────────────────────────

const ORDER_STEPS: { status: OrderStatus; label: string; desc: string; icon: React.ElementType }[] = [
  { status: 'PENDING',   label: 'Order Received',  desc: 'Your order is in the queue',    icon: Clock       },
  { status: 'CONFIRMED', label: 'Confirmed',        desc: 'Kitchen has your order',        icon: CheckCircle },
  { status: 'PREPARING', label: 'Being Prepared',   desc: 'The chef is cooking your food', icon: ChefHat     },
  { status: 'READY',     label: 'Ready!',           desc: 'Your food is ready to serve',   icon: Bell        },
  { status: 'SERVED',    label: 'Served',           desc: 'Enjoy your meal!',              icon: Utensils    },
];

const STATUS_STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, SERVED: 4,
};

const SESSION_KEY = 'grabeat_session';

function getOrCreateSession(): string {
  let session = sessionStorage.getItem(SESSION_KEY);
  if (!session) {
    session = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

// ─── Category colour helpers ─────────────────────────────────────────────────

const CAT_COLOURS = [
  'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500',   'bg-indigo-500',
];

// ─── MenuItem card ────────────────────────────────────────────────────────────

interface MenuItemCardProps {
  item: MenuItem;
  qty: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (id: number) => void;
  catIndex: number;
}

function MenuItemCard({ item, qty, onAdd, onRemove, catIndex }: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex border border-gray-100 hover:shadow-md transition-shadow">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-24 h-24 sm:w-28 sm:h-28 object-cover flex-shrink-0" />
      ) : (
        <div className={`w-24 h-24 sm:w-28 sm:h-28 ${CAT_COLOURS[catIndex % CAT_COLOURS.length]} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
          <UtensilsCrossed size={28} className={`${CAT_COLOURS[catIndex % CAT_COLOURS.length].replace('bg-', 'text-')} opacity-40`} />
        </div>
      )}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-1">{item.name}</h3>
            <div className="flex gap-1 flex-shrink-0">
              {item.isVegetarian && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Veg</span>}
              {item.isSpicy && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Spicy</span>}
            </div>
          </div>
          {item.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-orange-500 text-sm">NPR {item.price.toFixed(2)}</span>
          {qty === 0 ? (
            <button
              onClick={() => onAdd(item)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRemove(item.id)}
                className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 transition"
              >
                <Minus size={12} />
              </button>
              <span className="w-5 text-center font-bold text-sm text-gray-800">{qty}</span>
              <button
                onClick={() => onAdd(item)}
                className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Panel (used both as sidebar on desktop and drawer on mobile) ────────

interface CartPanelProps {
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  onRemove: (id: number) => void;
  onUpdateInstructions: (id: number, val: string) => void;
  customerName: string;
  onNameChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  onPlace: () => void;
  placing: boolean;
  error: string;
  onClose?: () => void;
  asDrawer?: boolean;
}

function CartPanel({
  cart, onAdd, onRemove, onUpdateInstructions,
  customerName, onNameChange, notes, onNotesChange,
  onPlace, placing, error, onClose, asDrawer,
}: CartPanelProps) {
  const subtotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const tax      = subtotal * 0.13;
  const service  = subtotal * 0.10;
  const total    = subtotal + tax + service;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart size={18} className="text-orange-500" /> Your Order
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
          <ShoppingCart size={40} className="mb-3 opacity-20" />
          <p className="text-sm">Your cart is empty</p>
          <p className="text-xs mt-1 text-gray-300">Add items from the menu</p>
        </div>
      ) : (
        <>
          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {cart.map(c => (
              <div key={c.menuItem.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">{c.menuItem.name}</p>
                    <p className="text-orange-500 text-sm font-semibold">NPR {(c.menuItem.price * c.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onRemove(c.menuItem.id)}
                      className="w-7 h-7 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center font-bold text-sm">{c.quantity}</span>
                    <button
                      onClick={() => onAdd(c.menuItem)}
                      className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Special instructions (optional)..."
                  value={c.specialInstructions || ''}
                  onChange={e => onUpdateInstructions(c.menuItem.id, e.target.value)}
                  className="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-300 text-gray-600"
                />
              </div>
            ))}

            {/* Customer info */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={customerName}
                onChange={e => onNameChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <textarea
                placeholder="Order notes (allergies, preferences...)"
                value={notes}
                onChange={e => onNotesChange(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>

            {/* Price breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>NPR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Tax (13%)</span><span>NPR {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Service (10%)</span><span>NPR {service.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-200 pt-2 mt-1">
                <span>Total</span><span className="text-orange-500">NPR {total.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg p-2">{error}</p>}
          </div>

          {/* Place order button */}
          <div className="px-5 pb-5 pt-2 flex-shrink-0 border-t border-gray-100">
            <button
              onClick={onPlace}
              disabled={placing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-2xl transition text-base"
            >
              {placing ? 'Placing Order...' : `Place Order · NPR ${total.toFixed(2)}`}
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (asDrawer) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {content}
    </div>
  );
}

// ─── Order Status Tracker ─────────────────────────────────────────────────────

function OrderTracker({ order, onOrderMore, bookingInfo }: { order: Order; onOrderMore: () => void; bookingInfo?: BookingItem | null }) {
  const [khaltiLoading, setKhaltiLoading] = useState(false);
  const [khaltiError, setKhaltiError] = useState('');

  const stepIndex  = STATUS_STEP_INDEX[order.status] ?? 0;
  const isCancelled = order.status === 'CANCELLED';
  const isServed    = order.status === 'SERVED';
  const awaitingPayment = isServed && order.paymentStatus === 'UNPAID';

  const handleKhaltiPay = async () => {
    setKhaltiLoading(true);
    setKhaltiError('');
    try {
      const res = await billingService.customerInitiateKhaltiPayment(order.id);
      window.location.href = res.paymentUrl;
    } catch (e: any) {
      setKhaltiError(e?.response?.data?.message || 'Failed to start Khalti payment. Please try again.');
    } finally {
      setKhaltiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Top icon */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md ${
            isCancelled       ? 'bg-red-100'     :
            awaitingPayment   ? 'bg-blue-100'    :
            isServed          ? 'bg-green-100'   :
                                'bg-orange-100'
          }`}>
            {awaitingPayment ? (
              <CreditCard size={36} className="text-blue-500" />
            ) : (
              <UtensilsCrossed size={36} className={
                isCancelled ? 'text-red-500'  :
                isServed    ? 'text-green-600' :
                              'text-orange-500'
              } />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isCancelled     ? 'Order Cancelled'    :
             awaitingPayment ? 'Awaiting Payment'   :
             isServed        ? 'Enjoy your meal!'   :
                               'Order Placed!'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Order #{order.id} · Table {order.tableNumber}
          </p>
        </div>

        {/* Pre-order booking details card */}
        {bookingInfo && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
              <CalendarClock size={13} /> Your Reservation
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <UtensilsCrossed size={14} className="text-orange-400 flex-shrink-0" />
                <span className="font-semibold">Table {bookingInfo.tableNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin size={14} className="text-orange-400 flex-shrink-0" />
                <span>{bookingInfo.tableFloor.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock size={14} className="text-orange-400 flex-shrink-0" />
                <span>{bookingInfo.startTime.slice(0, 5)} – {bookingInfo.endTime.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users size={14} className="text-orange-400 flex-shrink-0" />
                <span>{bookingInfo.partySize} {bookingInfo.partySize === 1 ? 'guest' : 'guests'}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-orange-100 flex items-center gap-2">
              <BadgeCheck size={14} className={bookingInfo.status === 'CONFIRMED' ? 'text-green-500' : 'text-yellow-500'} />
              <span className={`text-xs font-semibold ${bookingInfo.status === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'}`}>
                Booking {bookingInfo.status === 'CONFIRMED' ? 'Confirmed' : 'Pending confirmation'} · {bookingInfo.bookingDate}
              </span>
            </div>
          </div>
        )}

        {/* Awaiting payment banner */}
        {awaitingPayment && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4 text-center">
            <p className="text-blue-800 font-semibold text-sm mb-1">Your food has been served!</p>
            <p className="text-blue-600 text-xs mb-3">Pay online with Khalti or wait for staff.</p>
            <div className="bg-white rounded-xl py-3 px-4 mb-4">
              <p className="text-xs text-gray-500 mb-0.5">Total Amount Due</p>
              <p className="text-3xl font-extrabold text-orange-600">NPR {order.totalAmount.toFixed(2)}</p>
            </div>
            {khaltiError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{khaltiError}</p>
            )}
            <button
              onClick={handleKhaltiPay}
              disabled={khaltiLoading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {khaltiLoading ? (
                'Opening Khalti...'
              ) : (
                <><ExternalLink size={16} /> Pay Now with Khalti</>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">You'll be redirected to Khalti to complete payment.</p>
          </div>
        )}

        {/* Status tracker */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-700">Order Status</p>
              {!isServed && (
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                  Live updates
                </span>
              )}
            </div>
            <div className="space-y-3">
              {ORDER_STEPS.map((step, idx) => {
                const done   = idx < stepIndex;
                const active = idx === stepIndex;
                const Icon   = step.icon;
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done   ? 'bg-green-500'  :
                      active ? 'bg-orange-500 shadow-lg shadow-orange-100' :
                               'bg-gray-100'
                    }`}>
                      <Icon size={18} className={done || active ? 'text-white' : 'text-gray-300'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        active ? 'text-orange-600' : done ? 'text-green-600' : 'text-gray-300'
                      }`}>{step.label}</p>
                      {active && <p className="text-xs text-gray-400">{step.desc}</p>}
                    </div>
                    {active && !isServed && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        Now
                      </span>
                    )}
                    {done && <CheckCircle size={16} className="text-green-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <p className="text-sm font-bold text-gray-700 mb-3">Order Summary</p>
          <div className="space-y-1">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-0.5">
                <span className="text-gray-600">{item.quantity}× {item.menuItemName}</span>
                <span className="text-gray-500">NPR {item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span><span>NPR {order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax (13%)</span><span>NPR {order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Service (10%)</span><span>NPR {order.serviceChargeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-100 pt-2">
              <span>Total</span>
              <span className="text-orange-500">NPR {order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!awaitingPayment && !isServed && (
          <button
            onClick={onOrderMore}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl transition text-sm"
          >
            + Order More Items
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const qrToken    = searchParams.get('table') || '';
  const isPreOrder = searchParams.get('preorder') === '1';
  const bookingId  = searchParams.get('booking');

  const { user } = useAuth();

  const [tableInfo,      setTableInfo]      = useState<TableInfo | null>(null);
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [menuItems,      setMenuItems]      = useState<MenuItem[]>([]);
  const [cart,           setCart]           = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchKeyword,  setSearchKeyword]  = useState('');
  const [searchResults,  setSearchResults]  = useState<MenuItem[] | null>(null);
  const [topPicks,       setTopPicks]       = useState<TopPick[]>([]);
  const [showCart,       setShowCart]       = useState(false);
  const [customerName,   setCustomerName]   = useState(user?.fullName || '');
  const [notes,          setNotes]          = useState(
    isPreOrder && bookingId ? `Pre-order for booking #${bookingId}` : ''
  );
  const [placedOrder,    setPlacedOrder]    = useState<Order | null>(null);
  const [preOrderBooking, setPreOrderBooking] = useState<BookingItem | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [placing,        setPlacing]        = useState(false);
  const [error,          setError]          = useState('');

  const placedOrderRef = useRef<Order | null>(null);
  placedOrderRef.current = placedOrder;

  useEffect(() => {
    if (!qrToken) {
      setError('Invalid QR code. Please scan the QR code at your table.');
      setLoading(false);
      return;
    }
    Promise.all([
      menuService.resolveQrToken(qrToken),
      menuService.getCategories(),
      menuService.getFullMenu(),
      recommendationService.getTopPicks().catch(() => []),
      isPreOrder && bookingId && user
        ? tableService.getBookingById(Number(bookingId)).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([table, cats, items, picks, booking]) => {
        setTableInfo(table as TableInfo);
        setCategories(cats as Category[]);
        setMenuItems(items as MenuItem[]);
        setTopPicks((picks ?? []) as TopPick[]);
        if ((cats as Category[]).length > 0) setActiveCategory((cats as Category[])[0].id);
        if (booking) setPreOrderBooking(booking as BookingItem);
      })
      .catch(() => setError('Could not load menu. Please try again.'))
      .finally(() => setLoading(false));
  }, [qrToken, isPreOrder, bookingId, user]);

  // Poll order status while active
  useEffect(() => {
    if (!placedOrder || placedOrder.status === 'SERVED' || placedOrder.status === 'CANCELLED') return;
    const id = setInterval(async () => {
      try {
        const updated = await orderService.getOrderById(placedOrder.id);
        setPlacedOrder(updated);
      } catch {}
    }, 10_000);
    return () => clearInterval(id);
  }, [placedOrder?.id, placedOrder?.status]);

  // WebSocket live updates
  useOrderSocket(useCallback((update) => {
    const current = placedOrderRef.current;
    if (!current || update.orderId !== current.id) return;
    setPlacedOrder(prev => prev
      ? { ...prev, status: update.status as OrderStatus, paymentStatus: update.paymentStatus as PaymentStatus }
      : prev
    );
  }, []));

  const handleSearch = useCallback(async (keyword: string) => {
    setSearchKeyword(keyword);
    if (!keyword.trim()) { setSearchResults(null); return; }
    const results = await menuService.searchMenu(keyword);
    setSearchResults(results);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId);
      if (existing && existing.quantity > 1) return prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.menuItem.id !== itemId);
    });
  };

  const updateInstructions = (itemId: number, val: string) => {
    setCart(prev => prev.map(c => c.menuItem.id === itemId ? { ...c, specialInstructions: val } : c));
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const getQty    = (id: number) => cart.find(c => c.menuItem.id === id)?.quantity || 0;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    setError('');
    try {
      const order = await orderService.placeOrder({
        tableQrToken: qrToken,
        customerName: customerName.trim() || undefined,
        sessionToken: getOrCreateSession(),
        items: cart.map(c => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          specialInstructions: c.specialInstructions,
        })),
        notes: notes.trim() || undefined,
        userId: user?.id ?? undefined,
      });
      setPlacedOrder(order);
      setCart([]);
      setShowCart(false);
    } catch {
      setError('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const activeCatIndex = categories.findIndex(c => c.id === activeCategory);
  const visibleItems = (searchResults !== null
    ? searchResults
    : menuItems.filter(item => item.categoryId === activeCategory)
  ).filter(item => item.isAvailable !== false);

  // ── Loading / Error ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error && !tableInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid QR Code</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Order placed — show tracker ──────────────────────────────────────────────

  if (placedOrder) {
    return (
      <OrderTracker
        order={placedOrder}
        onOrderMore={() => setPlacedOrder(null)}
        bookingInfo={preOrderBooking}
      />
    );
  }

  // ── Main ordering view ───────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">

      {/* ── Pre-order banner ───────────────────────────────────────────────── */}
      {isPreOrder && (
        <div className="bg-orange-500 text-white px-4 py-3 flex-shrink-0">
          <div className="flex items-start gap-2">
            <CalendarClock size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">
                Pre-ordering ahead of your visit
                {preOrderBooking ? ` — Table ${preOrderBooking.tableNumber}` : bookingId ? ` (Booking #${bookingId})` : ''}
              </p>
              {preOrderBooking ? (
                <p className="text-orange-100 text-xs mt-0.5">
                  {preOrderBooking.bookingDate} · {preOrderBooking.startTime.slice(0, 5)}–{preOrderBooking.endTime.slice(0, 5)} ·{' '}
                  {preOrderBooking.partySize} {preOrderBooking.partySize === 1 ? 'guest' : 'guests'} ·{' '}
                  {preOrderBooking.tableFloor.replace('_', ' ')} ·{' '}
                  <span className={preOrderBooking.status === 'CONFIRMED' ? 'font-semibold' : ''}>
                    {preOrderBooking.status === 'CONFIRMED' ? '✓ Confirmed' : 'Pending confirmation'}
                  </span>
                </p>
              ) : (
                <p className="text-orange-100 text-xs mt-0.5">Food will be prepared before you arrive!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-shrink-0">
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <UtensilsCrossed size={20} className="text-orange-500" />
              GrabEat
            </h1>
            {tableInfo && (
              <p className="text-xs text-gray-400">Table {tableInfo.tableNumber} · {tableInfo.floor}</p>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchKeyword}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Cart button (mobile / always visible) */}
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition flex-shrink-0"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-orange-500 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        {!searchKeyword && (
          <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchResults(null); setSearchKeyword(''); }}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Body: menu + desktop cart sidebar ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">

        {/* Menu column */}
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:pr-2 pb-28 lg:pb-6">

          {/* Top picks */}
          {!searchKeyword && topPicks.length > 0 && activeCatIndex === 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Star size={14} className="text-orange-500 fill-orange-500" /> Top Picks
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {topPicks.slice(0, 6).map(pick => {
                  const menuItem = menuItems.find(m => m.id === pick.menuItemId);
                  const qty = menuItem ? getQty(menuItem.id) : 0;
                  return (
                    <div key={pick.id} className="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm overflow-hidden border border-orange-100">
                      {pick.imageUrl
                        ? <img src={pick.imageUrl} alt={pick.menuItemName} className="w-full h-24 object-cover" />
                        : <div className="w-full h-24 bg-orange-50 flex items-center justify-center"><UtensilsCrossed size={22} className="text-orange-300" /></div>
                      }
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{pick.menuItemName}</p>
                        <p className="text-xs text-orange-500 font-bold">NPR {pick.price}</p>
                        {menuItem && (
                          <button
                            onClick={() => qty === 0 ? addToCart(menuItem) : undefined}
                            className="mt-1.5 w-full text-xs bg-orange-500 text-white py-1 rounded-lg font-medium"
                          >
                            {qty > 0 ? `In cart (${qty})` : '+ Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {searchKeyword && (
            <p className="text-sm text-gray-500 mb-4">
              {visibleItems.length} result{visibleItems.length !== 1 ? 's' : ''} for "<span className="font-medium text-orange-500">{searchKeyword}</span>"
            </p>
          )}

          {visibleItems.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-20" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  qty={getQty(item.id)}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                  catIndex={activeCatIndex}
                />
              ))}
            </div>
          )}
        </main>

        {/* Desktop cart sidebar */}
        <aside className="hidden lg:flex flex-col w-96 flex-shrink-0 border-l border-gray-200 overflow-y-auto">
          <CartPanel
            cart={cart}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onUpdateInstructions={updateInstructions}
            customerName={customerName}
            onNameChange={setCustomerName}
            notes={notes}
            onNotesChange={setNotes}
            onPlace={placeOrder}
            placing={placing}
            error={error}
          />
        </aside>
      </div>

      {/* Mobile floating cart button */}
      {cartCount > 0 && !showCart && (
        <div className="lg:hidden fixed bottom-5 left-0 right-0 px-4 z-30">
          <button
            onClick={() => setShowCart(true)}
            className="w-full max-w-md mx-auto flex bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl shadow-lg items-center justify-between px-6 transition"
          >
            <span className="bg-orange-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
              {cartCount}
            </span>
            <span>View Cart</span>
            <span>NPR {(cartTotal * 1.23).toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Mobile cart drawer */}
      {showCart && (
        <div className="lg:hidden">
          <CartPanel
            cart={cart}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onUpdateInstructions={updateInstructions}
            customerName={customerName}
            onNameChange={setCustomerName}
            notes={notes}
            onNotesChange={setNotes}
            onPlace={placeOrder}
            placing={placing}
            error={error}
            onClose={() => setShowCart(false)}
            asDrawer
          />
        </div>
      )}
    </div>
  );
}
