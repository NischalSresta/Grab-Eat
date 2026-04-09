import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  User as UserIcon,
  Calendar,
  Clock,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  BookOpen,
  LayoutGrid,
  Star,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui';
import { tableService } from '../../services/table.service';
import type { BookingItem } from '../../types/table.types';
import {
  TABLE_FLOOR_LABELS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
} from '../../types/table.types';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const loadRecentBookings = useCallback(async () => {
    try {
      const page = await tableService.getMyBookings(0, 3);
      setRecentBookings(page.content);
      setPendingCount(page.content.filter(b => b.status === 'PENDING').length);
      setConfirmedCount(page.content.filter(b => b.status === 'CONFIRMED').length);
    } catch {
      // not critical if this fails
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentBookings();
  }, [loadRecentBookings]);

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const quickActions = [
    {
      icon: <UtensilsCrossed size={22} className="text-red-600" />,
      label: 'Book a Table',
      description: 'Reserve your perfect spot',
      color: 'bg-red-50 hover:bg-red-100 border-red-200',
      textColor: 'text-red-700',
      onClick: () => navigate('/tables/book'),
    },
    {
      icon: <BookOpen size={22} className="text-blue-600" />,
      label: 'My Bookings',
      description: 'View & manage reservations',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      textColor: 'text-blue-700',
      onClick: () => navigate('/my-bookings'),
    },
    {
      icon: <ShoppingBag size={22} className="text-orange-600" />,
      label: 'My Orders',
      description: 'Track your food orders live',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      textColor: 'text-orange-700',
      onClick: () => navigate('/my-orders'),
    },
    {
      icon: <LayoutGrid size={22} className="text-emerald-600" />,
      label: 'Floor Plan',
      description: 'See live table availability',
      color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
      textColor: 'text-emerald-700',
      onClick: () => navigate('/tables/floor-plan'),
    },
    {
      icon: <Star size={22} className="text-yellow-600" />,
      label: 'Loyalty Points',
      description: 'View rewards & redeem points',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      textColor: 'text-yellow-700',
      onClick: () => navigate('/loyalty'),
    },
    {
      icon: <MapPin size={22} className="text-orange-600" />,
      label: 'Browse Menu',
      description: 'Explore dishes & top picks',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      textColor: 'text-orange-700',
      onClick: () => navigate('/menu'),
    },
    {
      icon: <UserIcon size={22} className="text-purple-600" />,
      label: 'My Profile',
      description: 'Update info & birthday',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      textColor: 'text-purple-700',
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">GE</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-gradient">GrabEat</h1>
                <p className="text-xs text-gray-500">Customer Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <UserIcon size={15} className="text-gray-500" />
                <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 animate-fade-up">
        {/* Hero Welcome Banner */}
        <div className="rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden" style={{background:'linear-gradient(135deg,#f97316 0%,#ea580c 50%,#c2410c 100%)'}}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold mb-1">
              Welcome back, {user?.fullName?.split(' ')[0]}!
            </h2>
            <p className="text-primary-100 mb-6">
              Ready to enjoy a great dining experience? Book your table below.
            </p>
            <button
              type="button"
              onClick={() => navigate('/tables/book')}
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors shadow-sm text-sm"
            >
              <Plus size={16} />
              Make a Reservation
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending', value: pendingCount, color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
            { label: 'Confirmed', value: confirmedCount, color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).getFullYear() : '—', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
              <div className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map(action => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={`flex items-center gap-4 p-5 rounded-xl border text-left hover-lift ${action.color}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 shadow-sm">{action.icon}</div>
                <div className="flex-1">
                  <p className={`font-semibold text-base ${action.textColor}`}>{action.label}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          {bookingsLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <UtensilsCrossed size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No bookings yet. Make your first reservation!</p>
              <Button size="sm" onClick={() => navigate('/tables/book')}>
                <Plus size={14} />
                Book a Table
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed size={16} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      Table {booking.tableNumber} · {TABLE_FLOOR_LABELS[booking.tableFloor]}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(booking.bookingDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {booking.startTime.slice(0, 5)}–{booking.endTime.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${BOOKING_STATUS_COLORS[booking.status]}`}>
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Account Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Full Name', value: user?.fullName },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phoneNumber || '—' },
              { label: 'User ID', value: `#${user?.id}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-500">{label}</p>
                <p className="font-medium text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {user?.isActive ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {user?.isActive ? 'Active Account' : 'Account Inactive'}
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${user?.isEmailVerified ? 'text-blue-600' : 'text-yellow-600'}`}>
              {user?.isEmailVerified ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
