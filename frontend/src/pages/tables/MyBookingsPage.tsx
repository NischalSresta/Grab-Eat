import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  RefreshCw,
  Plus,
  X,
  UtensilsCrossed,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { tableService } from '../../services/table.service';
import type { BookingItem, BookingStatus, PageResponse } from '../../types/table.types';
import {
  TABLE_FLOOR_LABELS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
} from '../../types/table.types';

interface ConfirmedNotif {
  tableNumber: string;
  bookingDate: string;
  startTime: string;
  partySize: number;
}

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookingsPage, setBookingsPage] = useState<PageResponse<BookingItem> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Booking-confirmed notification
  const [confirmedNotif, setConfirmedNotif] = useState<ConfirmedNotif | null>(null);
  const prevStatuses = useRef<Record<number, BookingStatus>>({});
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('tableBookingNotice');
    if (stored) setNotice(stored);

    const onBooked = (e: Event) => {
      const ce = e as CustomEvent<{ message?: string }>;
      setNotice(ce.detail?.message ?? 'Table has been booked or reserved.');
    };

    window.addEventListener('table-booked', onBooked as EventListener);
    return () => {
      window.removeEventListener('table-booked', onBooked as EventListener);
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, []);

  const fetchBookings = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tableService.getMyBookings(page, 8);
      setBookingsPage(data);

      // Detect PENDING → CONFIRMED transitions for the notification
      const hasPrev = Object.keys(prevStatuses.current).length > 0;
      if (hasPrev) {
        const newlyConfirmed = data.content.filter(
          b =>
            b.status === 'CONFIRMED' &&
            prevStatuses.current[b.id] === 'PENDING'
        );
        if (newlyConfirmed.length > 0) {
          const b = newlyConfirmed[0];
          if (notifTimer.current) clearTimeout(notifTimer.current);
          setConfirmedNotif({
            tableNumber: b.tableNumber,
            bookingDate: b.bookingDate,
            startTime: b.startTime,
            partySize: b.partySize,
          });
          notifTimer.current = setTimeout(() => setConfirmedNotif(null), 7000);
        }
      }

      // Update tracked statuses
      const updated: Record<number, BookingStatus> = {};
      data.content.forEach(b => { updated[b.id] = b.status; });
      prevStatuses.current = updated;
    } catch {
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(currentPage);
  }, [fetchBookings, currentPage]);


  // Poll every 15 s to detect booking confirmation from admin
  useEffect(() => {
    const id = setInterval(() => fetchBookings(currentPage), 15_000);
    return () => clearInterval(id);
  }, [currentPage, fetchBookings]);

  const handlePreOrder = (booking: BookingItem) => {
    const qrToken = booking.tableQrToken;
    if (!qrToken) {
      setError('QR code not available for this table. Please contact staff.');
      return;
    }
    navigate(`/order?table=${qrToken}&preorder=1&booking=${booking.id}`);
  };

  const handleCancel = async (booking: BookingItem) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(booking.id);
    try {
      await tableService.cancelBooking(booking.id);
      fetchBookings(currentPage);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to cancel booking.';
      setError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => timeStr.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">My Bookings</h1>
              <p className="text-xs text-gray-500">Your table reservations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchBookings(currentPage)}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => navigate('/tables/book')}>
              <Plus size={14} />
              New Booking
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Booking-confirmed notification banner */}
        {confirmedNotif && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-green-600 text-white rounded-xl shadow-lg">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-sm">Your booking has been confirmed!</p>
              <p className="text-green-100 text-xs mt-0.5">
                Table {confirmedNotif.tableNumber} · {confirmedNotif.partySize}{' '}
                {confirmedNotif.partySize === 1 ? 'guest' : 'guests'} ·{' '}
                {confirmedNotif.bookingDate} at {confirmedNotif.startTime.slice(0, 5)}
              </p>
            </div>
            <button
              onClick={() => {
                setConfirmedNotif(null);
                if (notifTimer.current) clearTimeout(notifTimer.current);
              }}
              className="p-1 rounded hover:bg-green-700 transition-colors flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : bookingsPage?.content.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <Calendar size={40} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              You haven't made any table reservations. Book your first table now!
            </p>
            <Button onClick={() => navigate('/tables/book')}>
              <Plus size={16} />
              Book a Table
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {bookingsPage?.content.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  {/* Colored top strip by status */}
                  <div
                    className={`h-1.5 ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-400'
                        : booking.status === 'PENDING'
                        ? 'bg-yellow-400'
                        : booking.status === 'CANCELLED'
                        ? 'bg-red-400'
                        : 'bg-blue-400'
                    }`}
                  />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <UtensilsCrossed size={14} className="text-orange-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Table {booking.tableNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {TABLE_FLOOR_LABELS[booking.tableFloor]} · Booking #{booking.id}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BOOKING_STATUS_COLORS[booking.status]}`}
                      >
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400 shrink-0" />
                        <span>{formatDate(booking.bookingDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        <span>
                          {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-gray-400 shrink-0" />
                        <span>
                          {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 italic">
                        "{booking.specialRequests}"
                      </p>
                    )}

                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Pre-order food CTA */}
                        <button
                          onClick={() => handlePreOrder(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition"
                        >
                          <ShoppingBag size={14} />
                          Pre-order Food
                        </button>

                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={cancellingId === booking.id}
                          onClick={() => handleCancel(booking)}
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {bookingsPage && bookingsPage.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {bookingsPage.pageNumber + 1} of {bookingsPage.totalPages} ·{' '}
                  {bookingsPage.totalElements} bookings
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bookingsPage.first}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bookingsPage.last}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyBookingsPage;
