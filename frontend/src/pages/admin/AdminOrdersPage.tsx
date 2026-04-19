import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../services/order.service';
import type { Order, OrderStatus } from '../../types/menu.types';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const STATUS_TABS: { label: string; value: OrderStatus }[] = [
  { label: 'Served', value: 'SERVED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
];

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-yellow-100 text-yellow-700',
  REFUNDED: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  SERVED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-teal-100 text-teal-700',
  PREPARING: 'bg-orange-100 text-orange-700',
  READY: 'bg-purple-100 text-purple-700',
};

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('SERVED');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async (status: OrderStatus) => {
    setLoading(true);
    setOrders([]);
    try {
      const data = await orderService.getOrdersByStatus(status);
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.tableNumber?.toLowerCase().includes(q) ||
      String(o.id).includes(q) ||
      o.customerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <button
          onClick={() => load(activeTab)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setExpandedId(null); setSearch(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.value
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by table, order ID, or customer name..."
        className="w-full mb-5 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          No {activeTab.toLowerCase()} orders found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">Order</span>
                    <p className="font-semibold text-gray-800">#{order.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Table</span>
                    <p className="font-medium text-gray-700">{order.tableNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Total</span>
                    <p className="font-semibold text-orange-600">NPR {order.totalAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Time</span>
                    <p className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus]}`}>
                    {order.paymentStatus}
                  </span>
                  {expandedId === order.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {expandedId === order.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                  {order.customerName && (
                    <p className="text-xs text-gray-500 mb-2">Customer: <span className="font-medium text-gray-700">{order.customerName}</span></p>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-200">
                        <th className="text-left pb-1">Item</th>
                        <th className="text-center pb-1">Qty</th>
                        <th className="text-right pb-1">Price</th>
                        <th className="text-right pb-1">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-1.5 text-gray-700">{item.menuItemName}</td>
                          <td className="py-1.5 text-center text-gray-500">{item.quantity}</td>
                          <td className="py-1.5 text-right text-gray-500">NPR {item.unitPrice.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-medium text-gray-700">NPR {item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 pt-2 border-t border-gray-200 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between"><span>Subtotal</span><span>NPR {order.subtotal?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Tax (13%)</span><span>NPR {order.taxAmount?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Service (10%)</span><span>NPR {order.serviceChargeAmount?.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-sm text-gray-800 pt-1 border-t border-gray-200">
                      <span>Total</span><span className="text-orange-600">NPR {order.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                  {order.notes && <p className="mt-2 text-xs text-gray-500 italic">Notes: {order.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
