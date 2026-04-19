import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  StickyNote,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { tableService } from '../../services/table.service';
import type { TableItem, TableFloor, CreateBookingRequest } from '../../types/table.types';
import { TABLE_FLOOR_LABELS } from '../../types/table.types';

const ALL_FLOORS: TableFloor[] = ['INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE_DINING', 'TERRACE'];

type Step = 'search' | 'pick-table' | 'confirm' | 'success';

const TableBookingPage = () => {
  const navigate = useNavigate();

  /* ── Step state ─────────────────────────────────────────────────────── */
  const [step, setStep] = useState<Step>('search');

  /* ── Search form state ──────────────────────────────────────────────── */
  const [searchDate, setSearchDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [selectedFloor, setSelectedFloor] = useState<TableFloor | 'ALL'>('ALL');

  /* ── Results state ──────────────────────────────────────────────────── */
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [_hasSearched, setHasSearched] = useState(false);

  /* ── Booking state ──────────────────────────────────────────────────── */
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);

  const today = new Date().toISOString().split('T')[0];

  /* ── Derived floor groups ───────────────────────────────────────────── */
  const groupedTables = useCallback(() => {
    if (selectedFloor !== 'ALL') return { [selectedFloor]: tables };
    return tables.reduce<Record<string, TableItem[]>>((acc, t) => {
      if (!acc[t.floor]) acc[t.floor] = [];
      acc[t.floor].push(t);
      return acc;
    }, {});
  }, [tables, selectedFloor]);

  const handleSearch = async () => {
    if (!searchDate || !startTime || !endTime) {
      setSearchError('Please fill in date, start time, and end time.');
      return;
    }
    if (startTime >= endTime) {
      setSearchError('Start time must be before end time.');
      return;
    }
    setSearchError(null);
    setIsSearching(true);
    setHasSearched(false);
    try {
      const result = await tableService.getAvailableTables({
        date: searchDate,
        startTime: startTime + ':00',
        endTime: endTime + ':00',
        partySize,
        floor: selectedFloor === 'ALL' ? undefined : selectedFloor,
      });
      setTables(result);
      setHasSearched(true);
      setStep('pick-table');
    } catch {
      setSearchError('Failed to load available tables. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTable = (table: TableItem) => {
    setSelectedTable(table);
    setBookingError(null);
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedTable) return;
    setIsBooking(true);
    setBookingError(null);
    try {
      const payload: CreateBookingRequest = {
        tableId: selectedTable.id,
        bookingDate: searchDate,
        startTime: startTime + ':00',
        endTime: endTime + ':00',
        partySize,
        specialRequests: specialRequests.trim() || undefined,
      };
      const booking = await tableService.createBooking(payload);
      setCreatedBookingId(booking.id);
      setStep('success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Booking failed. Please try again.';
      setBookingError(msg);
    } finally {
      setIsBooking(false);
    }
  };

  /* ── Step: Search ───────────────────────────────────────────────────── */
  const renderSearch = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-xl mb-8">
        <h2 className="text-2xl font-bold mb-1">Find Your Perfect Table</h2>
        <p className="text-primary-100 text-sm">
          Choose your date, time, and party size to browse available tables.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        {searchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {searchError}
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Calendar size={14} className="inline mr-1" />
            Date
          </label>
          <input
            type="date"
            min={today}
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
          />
        </div>

        {/* Time range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock size={14} className="inline mr-1" />
              From
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock size={14} className="inline mr-1" />
              To
            </label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            />
          </div>
        </div>

        {/* Party size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Users size={14} className="inline mr-1" />
            Party Size
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPartySize(v => Math.max(1, v - 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition"
            >
              −
            </button>
            <span className="text-2xl font-bold text-gray-800 w-8 text-center">{partySize}</span>
            <button
              type="button"
              onClick={() => setPartySize(v => Math.min(20, v + 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition"
            >
              +
            </button>
            <span className="text-sm text-gray-500">people</span>
          </div>
        </div>

        {/* Floor filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin size={14} className="inline mr-1" />
            Area / Floor
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedFloor('ALL')}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                selectedFloor === 'ALL'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              All Areas
            </button>
            {ALL_FLOORS.map(floor => (
              <button
                key={floor}
                type="button"
                onClick={() => setSelectedFloor(floor)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  selectedFloor === floor
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                }`}
              >
                {TABLE_FLOOR_LABELS[floor]}
              </button>
            ))}
          </div>
        </div>

        <Button
          fullWidth
          isLoading={isSearching}
          onClick={handleSearch}
          className="mt-2"
        >
          <Search size={16} />
          Search Available Tables
        </Button>
      </div>
    </div>
  );

  /* ── Step: Pick Table ───────────────────────────────────────────────── */
  const renderPickTable = () => {
    const groups = groupedTables();
    const hasResults = tables.length > 0;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setStep('search')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Available Tables</h2>
            <p className="text-sm text-gray-500">
              {searchDate} · {startTime}–{endTime} · {partySize} {partySize === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>

        {!hasResults ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <UtensilsCrossed size={40} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Tables Available</h3>
            <p className="text-gray-500 text-sm mb-6">
              Try a different date, time, or reduce your party size.
            </p>
            <Button variant="outline" onClick={() => setStep('search')}>
              Change Search
            </Button>
          </div>
        ) : (
          Object.entries(groups).map(([floor, floorTables]) => (
            <div key={floor} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {TABLE_FLOOR_LABELS[floor as TableFloor]}
                </h3>
                <span className="ml-auto text-sm text-gray-500">{floorTables.length} available</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {floorTables.map(table => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => handleSelectTable(table)}
                    className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-primary-400 hover:shadow-md transition group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary-50 group-hover:bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm transition">
                        {table.tableNumber}
                      </div>
                      <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700 mb-1">
                      <Users size={14} />
                      <span className="text-sm font-medium">Up to {table.capacity} people</span>
                    </div>
                    {table.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{table.description}</p>
                    )}
                    <div className="mt-3 text-xs font-semibold text-primary-600 group-hover:text-primary-700">
                      Select this table →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  /* ── Step: Confirm ──────────────────────────────────────────────────── */
  const renderConfirm = () => (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => { setStep('pick-table'); setBookingError(null); }}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Confirm Booking</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Summary Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
              {selectedTable?.tableNumber}
            </div>
            <div>
              <p className="font-semibold text-lg">Table {selectedTable?.tableNumber}</p>
              <p className="text-primary-100 text-sm">
                {TABLE_FLOOR_LABELS[selectedTable?.floor as TableFloor]}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {[
            { icon: <Calendar size={16} />, label: 'Date', value: searchDate },
            { icon: <Clock size={16} />, label: 'Time', value: `${startTime} – ${endTime}` },
            { icon: <Users size={16} />, label: 'Party Size', value: `${partySize} ${partySize === 1 ? 'person' : 'people'}` },
            { icon: <Users size={16} />, label: 'Table Capacity', value: `Up to ${selectedTable?.capacity} people` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                {icon}
              </div>
              <div className="flex-1 flex justify-between">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800">{value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Special Requests */}
        <div className="px-6 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <StickyNote size={14} className="inline mr-1" />
            Special Requests (optional)
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={specialRequests}
            onChange={e => setSpecialRequests(e.target.value)}
            placeholder="Allergies, occasion, seating preferences…"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm transition"
          />
        </div>

        {bookingError && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {bookingError}
          </div>
        )}

        <div className="px-6 pb-6 space-y-3">
          <Button fullWidth isLoading={isBooking} onClick={handleConfirmBooking}>
            <CheckCircle2 size={16} />
            Confirm Booking
          </Button>
          <Button fullWidth variant="outline" onClick={() => setStep('pick-table')}>
            Back to Tables
          </Button>
        </div>
      </div>
    </div>
  );

  /* ── Step: Success ──────────────────────────────────────────────────── */
  const renderSuccess = () => (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-1">
          Your booking #{createdBookingId} is <span className="font-semibold text-yellow-600">pending confirmation</span> from our staff.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You'll receive a confirmation once we've verified your reservation.
        </p>
        <div className="space-y-3">
          <Button fullWidth onClick={() => navigate('/my-bookings')}>
            View My Bookings
          </Button>
          <Button
            fullWidth
            variant="outline"
            onClick={() => {
              setStep('search');
              setSelectedTable(null);
              setSpecialRequests('');
              setTables([]);
              setHasSearched(false);
            }}
          >
            Book Another Table
          </Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">GE</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Book a Table</h1>
              <p className="text-xs text-gray-500">GrabEat Restaurant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Step indicator */}
            {(['search', 'pick-table', 'confirm', 'success'] as Step[]).map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition ${
                  s === step ? 'bg-primary-600 w-6' : 
                  (['search', 'pick-table', 'confirm', 'success'] as Step[]).indexOf(s) < (['search', 'pick-table', 'confirm', 'success'] as Step[]).indexOf(step)
                    ? 'bg-primary-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {step === 'search' && renderSearch()}
        {step === 'pick-table' && renderPickTable()}
        {step === 'confirm' && renderConfirm()}
        {step === 'success' && renderSuccess()}
      </main>
    </div>
  );
};

export default TableBookingPage;
