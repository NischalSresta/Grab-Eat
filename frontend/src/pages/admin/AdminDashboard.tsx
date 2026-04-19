import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, ShoppingBag, TrendingUp, ChefHat, Gift, AlertTriangle, Receipt, ArrowUpRight } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { tableService } from '../../services/table.service';

interface DashboardStats {
  totalStaff: number; totalCustomers: number; activeOrders: number;
  totalOrdersToday: number; totalMenuItems: number; revenueToday: number;
  revenueThisMonth: number; lowStockAlerts: number;
}

interface BookingCounts { PENDING: number; CONFIRMED: number; COMPLETED: number; CANCELLED: number; }

// Donut chart component
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 15.9155;
  const circ = 2 * Math.PI * r; // ≈ 100
  let offset = 0;
  return (
    <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="3.5" />
      {segments.map((seg, i) => {
        const pct = (seg.value / total) * circ;
        const dashArray = `${pct} ${circ - pct}`;
        const dashOffset = -offset;
        offset += pct;
        return (
          <circle key={i} cx="18" cy="18" r={r} fill="none"
            stroke={seg.color} strokeWidth="3.5"
            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

// Horizontal bar
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-3)' }}>
        <span>{label}</span>
        <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookingCounts, setBookingCounts] = useState<BookingCounts>({ PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats(),
      tableService.adminGetAllBookings(0, 200).catch(() => ({ content: [] })),
    ]).then(([s, bookings]) => {
      setStats(s);
      const counts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
      bookings.content.forEach((b: any) => {
        if (b.status in counts) counts[b.status as keyof BookingCounts]++;
      });
      setBookingCounts(counts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { title: 'Active Orders',    value: stats.activeOrders,                         icon: ShoppingBag,    accent: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { title: 'Orders Today',     value: stats.totalOrdersToday,                     icon: Receipt,        accent: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
    { title: 'Revenue Today',    value: `NPR ${stats.revenueToday.toFixed(0)}`,     icon: TrendingUp,     accent: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
    { title: 'Monthly Revenue',  value: `NPR ${stats.revenueThisMonth.toFixed(0)}`, icon: TrendingUp,     accent: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
    { title: 'Customers',        value: stats.totalCustomers,                       icon: Users,          accent: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
    { title: 'Staff Members',    value: stats.totalStaff,                           icon: Users,          accent: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
    { title: 'Menu Items',       value: stats.totalMenuItems,                       icon: ChefHat,        accent: '#ec4899', bg: 'rgba(236,72,153,0.1)'  },
    { title: 'Low Stock Alerts', value: stats.lowStockAlerts,
      icon: AlertTriangle,
      accent: stats.lowStockAlerts > 0 ? '#ef4444' : '#6b7280',
      bg:     stats.lowStockAlerts > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)' },
  ] : [];

  const quickActions = [
    { label: 'Billing',   desc: 'Process payments',   to: '/admin/billing',   icon: Receipt,     color: 'from-orange-500 to-amber-500'  },
    { label: 'Menu',      desc: 'Edit menu items',     to: '/admin/menu',      icon: ChefHat,     color: 'from-purple-500 to-indigo-500' },
    { label: 'Inventory', desc: 'Track stock levels',  to: '/admin/inventory', icon: Package,     color: 'from-emerald-500 to-teal-500'  },
    { label: 'Staff',     desc: 'Manage accounts',     to: '/admin/staff',     icon: Users,       color: 'from-blue-500 to-cyan-500'     },
    { label: 'Loyalty',   desc: 'Rewards & points',    to: '/admin/loyalty',   icon: Gift,        color: 'from-pink-500 to-rose-500'     },
    { label: 'Bookings',  desc: 'Confirm reservations',to: '/admin/bookings',  icon: ShoppingBag, color: 'from-violet-500 to-purple-500' },
  ];

  // Donut segments for bookings
  const donutSegments = [
    { value: bookingCounts.PENDING,   color: '#f59e0b', label: 'Pending'   },
    { value: bookingCounts.CONFIRMED, color: '#10b981', label: 'Confirmed' },
    { value: bookingCounts.COMPLETED, color: '#3b82f6', label: 'Completed' },
    { value: bookingCounts.CANCELLED, color: '#ef4444', label: 'Cancelled' },
  ];
  const totalBookings = donutSegments.reduce((s, x) => s + x.value, 0);

  // Revenue bars
  const maxRev = Math.max(stats?.revenueThisMonth ?? 1, 1);
  const avgDailyRev = stats ? stats.revenueThisMonth / 30 : 0;

  return (
    <div className="p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Live overview of your restaurant operations</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 skeleton" style={{ height: 96 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="card stat-card animate-fade-up p-5 cursor-default" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{stat.title}</p>
                    <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-1)' }}>{stat.value}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                    <Icon size={17} style={{ color: stat.accent }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom: Quick Actions + Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-fade-up" style={{ animationDelay: '200ms' }}>

        {/* ── Left: Quick Actions ─────────────────────────────── */}
        <div className="xl:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, desc, to, icon: Icon, color }) => (
              <Link key={label} to={to} className="card animate-fade-up group flex flex-col gap-3 p-4">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Right: Analytics ────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Analytics</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Booking Status Donut */}
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-1)' }}>Booking Overview</p>
              {loading ? (
                <div className="skeleton rounded-full w-32 h-32 mx-auto" />
              ) : totalBookings === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--text-4)' }}>No bookings yet</p>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Donut */}
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <DonutChart segments={donutSegments} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black" style={{ color: 'var(--text-1)' }}>{totalBookings}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>total</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {donutSegments.map(seg => (
                      <div key={seg.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                          <span style={{ color: 'var(--text-3)' }}>{seg.label}</span>
                        </div>
                        <span className="font-bold" style={{ color: 'var(--text-1)' }}>{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Revenue Snapshot */}
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-1)' }}>Revenue Snapshot</p>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  <Bar label="Today's Revenue" value={stats?.revenueToday ?? 0} max={maxRev} color="#f97316" />
                  <Bar label="Monthly Revenue" value={stats?.revenueThisMonth ?? 0} max={maxRev} color="#06b6d4" />
                  <Bar label="Avg. Daily (est.)" value={Math.round(avgDailyRev)} max={maxRev} color="#8b5cf6" />
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--text-3)' }}>Orders today</span>
                      <span className="font-bold" style={{ color: 'var(--text-1)' }}>{stats?.totalOrdersToday ?? 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* People Overview */}
            <div className="card p-5 sm:col-span-2">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-1)' }}>People Overview</p>
              {loading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Customers', value: stats?.totalCustomers ?? 0, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
                    { label: 'Staff', value: stats?.totalStaff ?? 0, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                    { label: 'Low Stock', value: stats?.lowStockAlerts ?? 0, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-4 text-center" style={{ background: item.bg }}>
                      <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Booking progress bars */}
              {!loading && totalBookings > 0 && (
                <div className="mt-4 space-y-3">
                  {donutSegments.filter(s => s.value > 0).map(seg => (
                    <Bar key={seg.label} label={`${seg.label} bookings`} value={seg.value} max={totalBookings} color={seg.color} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
