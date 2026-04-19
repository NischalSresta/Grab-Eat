import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  Bell,
  Clock3,
  ClipboardList,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { tableService } from '../../services/table.service';
import type { BookingItem } from '../../types/table.types';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [latestBookingNotice, setLatestBookingNotice] = useState<BookingItem | null>(null);
  const latestSeenBookingId = useRef<number | null>(null);

  const pollLatestBooking = useCallback(async () => {
    if (user?.role !== 'OWNER' && user?.role !== 'STAFF') return;
    try {
      const page = await tableService.adminGetAllBookings(0, 1);
      const newest = page.content?.[0];
      if (!newest) return;

      // First poll sets baseline silently to avoid old-data spam.
      if (latestSeenBookingId.current === null) {
        latestSeenBookingId.current = newest.id;
        return;
      }

      if (newest.id > latestSeenBookingId.current) {
        latestSeenBookingId.current = newest.id;
        setLatestBookingNotice(newest);
      }
    } catch {
      // Silent fail: layout should not break if poll endpoint has a temporary issue.
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'OWNER' && user?.role !== 'STAFF') return;
    pollLatestBooking();
    const id = window.setInterval(pollLatestBooking, 15000);
    return () => window.clearInterval(id);
  }, [pollLatestBooking, user?.role]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/staff/orders',    icon: ClipboardList,   label: 'Live Orders' },
    { path: '/admin/staff',     icon: Users,           label: 'Staff Management' },
    { path: '/admin/tables',    icon: UtensilsCrossed, label: 'Table Management' },
    { path: '/admin/settings',  icon: Settings,        label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold text-gray-800">GrabEat Admin</h1>}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={20} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          {isSidebarOpen && (
            <div className="mb-3 px-4">
              <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {latestBookingNotice && (
          <div className="sticky top-0 z-20 px-4 pt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start gap-2 flex-1">
                <Bell size={16} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">New Table Booking</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    <strong>{latestBookingNotice.userFullName}</strong> booked table{' '}
                    <strong>{latestBookingNotice.tableNumber}</strong> for {latestBookingNotice.partySize}{' '}
                    people on {latestBookingNotice.bookingDate} ({latestBookingNotice.startTime.slice(0, 5)} -{' '}
                    {latestBookingNotice.endTime.slice(0, 5)}).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate(
                      `/admin/tables?tableId=${latestBookingNotice.tableId}&bookingId=${latestBookingNotice.id}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  <Clock3 size={14} />
                  View Table
                </button>
                <button
                  onClick={() => setLatestBookingNotice(null)}
                  className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                  title="Dismiss"
                >
                  <X size={14} className="text-amber-700" />
                </button>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
