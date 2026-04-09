import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../services/order.service';
import { billingService } from '../../services/billing.service';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import type { Order } from '../../types/menu.types';
import type { BillResponse, PaymentMethod } from '../../types/billing.types';
import { CreditCard, Banknote, Smartphone, Receipt, Split, ExternalLink } from 'lucide-react';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'DIGITAL_WALLET', label: 'Digital Wallet', icon: Smartphone },
  { value: 'KHALTI', label: 'Khalti', icon: ExternalLink },
];

export default function BillingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [bill, setBill] = useState<BillResponse | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [splitCount, setSplitCount] = useState(2);
  const [showSplit, setShowSplit] = useState(false);
  const [splitResult, setSplitResult] = useState<{ amountPerPerson: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const active = await orderService.getActiveOrders();
      setOrders(active.filter(o => o.paymentStatus === 'UNPAID'));
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useOrderSocket(useCallback((update) => {
    fetchOrders();
    if (selectedOrder?.id === update.orderId && update.paymentStatus === 'PAID') {
      setSelectedOrder(null);
      setBill(null);
    }
  }, [fetchOrders, selectedOrder]));

  const selectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setBill(null);
    setSplitResult(null);
    setShowSplit(false);
    setBillLoading(true);
    try {
      setBill(await billingService.getBill(order.id));
    } catch {
      setError('Failed to load bill');
    } finally {
      setBillLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    setError('');
    try {
      if (paymentMethod === 'KHALTI') {
        const khaltiRes = await billingService.initiateKhaltiPayment(selectedOrder.id);
        // Open Khalti payment page in a new tab
        window.open(khaltiRes.paymentUrl, '_blank', 'noopener,noreferrer');
        setSuccessMsg(`Khalti payment initiated for Order #${selectedOrder.id}. Customer can now complete payment.`);
        setTimeout(() => setSuccessMsg(''), 8000);
      } else {
        await billingService.processPayment(selectedOrder.id, { paymentMethod });
        setSuccessMsg(`Order #${selectedOrder.id} paid via ${paymentMethod} ✓`);
        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
        setSelectedOrder(null);
        setBill(null);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!selectedOrder) return;
    try {
      const result = await billingService.splitBill(selectedOrder.id, { numberOfPeople: splitCount });
      setSplitResult(result);
    } catch {
      setError('Split failed');
    }
  };

  return (
    <div className="p-6 animate-fade-up flex gap-6 h-full">
      {/* Left: Order list */}
      <div className="w-80 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">Billing</h1>
          <span className="text-sm text-gray-400">{orders.length} unpaid</span>
        </div>

        {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-medium">{successMsg}</div>}
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No unpaid orders</p>
          </div>
        ) : (
          orders.map(order => (
            <button
              key={order.id}
              onClick={() => selectOrder(order)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedOrder?.id === order.id
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Table {order.tableNumber}</span>
                <span className="text-orange-600 font-bold text-sm">NPR {order.totalAmount?.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Order #{order.id} · {order.items?.length} items · {order.status}</p>
            </button>
          ))
        )}
      </div>

      {/* Right: Bill detail */}
      <div className="flex-1">
        {!selectedOrder ? (
          <div className="h-full flex items-center justify-center text-gray-300">
            <div className="text-center">
              <Receipt size={56} className="mx-auto mb-3 opacity-20" />
              <p className="text-lg">Select an order to process payment</p>
            </div>
          </div>
        ) : billLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Loading bill...</div>
        ) : bill ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Order #{bill.orderId} — Table {bill.tableNumber}</h2>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {bill.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}× {item.menuItemName}</span>
                  <span className="text-gray-600">NPR {item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm mb-5">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>NPR {bill.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax (13%)</span><span>NPR {bill.taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Service (10%)</span><span>NPR {bill.serviceChargeAmount.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                <span>Total</span><span className="text-orange-600">NPR {bill.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            {/* Split bill */}
            <div className="mb-4">
              <button
                onClick={() => { setShowSplit(!showSplit); setSplitResult(null); }}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Split size={14} /> Split Bill
              </button>
              {showSplit && (
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number" min={2} max={20}
                    value={splitCount}
                    onChange={e => setSplitCount(Number(e.target.value))}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                  />
                  <span className="text-sm text-gray-500">people</span>
                  <button onClick={handleSplit} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Calculate</button>
                  {splitResult && (
                    <span className="text-sm font-semibold text-blue-700">NPR {splitResult.amountPerPerson.toFixed(2)} each</span>
                  )}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map(pm => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                        paymentMethod === pm.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <Icon size={16} /> {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={processing}
              className={`w-full py-3 font-bold rounded-xl transition disabled:opacity-60 text-base flex items-center justify-center gap-2 ${
                paymentMethod === 'KHALTI'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {processing
                ? 'Processing...'
                : paymentMethod === 'KHALTI'
                  ? <><ExternalLink size={16} /> Open Khalti — NPR {bill.totalAmount?.toFixed(2)}</>
                  : `Collect Payment — NPR ${bill.totalAmount?.toFixed(2)}`
              }
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
