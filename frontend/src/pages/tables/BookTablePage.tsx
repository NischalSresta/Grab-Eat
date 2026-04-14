import React, { useEffect, useState } from 'react';
import { tableService } from '../../services/table.service';
import type { RestaurantTable, TableFloor, CreateBookingRequest } from '../../types/table.types';

const FLOORS: TableFloor[] = ['GROUND', 'FIRST', 'SECOND', 'ROOFTOP'];

const BookTablePage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<TableFloor>('GROUND');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    guestCount: 1,
    specialRequests: '',
  });
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    tableService.getTablesByFloor(selectedFloor).then(setTables).catch(console.error);
    setSelectedTable(null);
    setAvailable(null);
  }, [selectedFloor]);

  const handleCheckAvailability = async () => {
    if (!selectedTable || !form.bookingDate || !form.startTime || !form.endTime) return;
    try {
      const result = await tableService.checkAvailability(
        selectedTable.id, form.bookingDate, form.startTime, form.endTime
      );
      setAvailable(result);
    } catch {
      setError('Failed to check availability');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setLoading(true);
    setError('');
    try {
      const payload: CreateBookingRequest = {
        tableId: selectedTable.id,
        ...form,
      };
      await tableService.createBooking(payload);
      setSuccess(true);
    } catch {
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500">We will confirm your booking shortly.</p>
          <button
            onClick={() => { setSuccess(false); setSelectedTable(null); setAvailable(null); }}
            className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Book Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Book a Table</h1>

        {/* Floor selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FLOORS.map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFloor === floor
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {floor.charAt(0) + floor.slice(1).toLowerCase()} Floor
            </button>
          ))}
        </div>

        {/* Table grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => { setSelectedTable(table); setAvailable(null); }}
              disabled={table.status !== 'AVAILABLE'}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedTable?.id === table.id
                  ? 'border-orange-500 bg-orange-50'
                  : table.status === 'AVAILABLE'
                  ? 'border-gray-200 bg-white hover:border-orange-300'
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="font-semibold text-gray-800">T{table.tableNumber}</div>
              <div className="text-xs text-gray-500">{table.capacity} seats</div>
              <div className={`text-xs mt-1 font-medium ${
                table.status === 'AVAILABLE' ? 'text-green-600' : 'text-red-500'
              }`}>
                {table.status}
              </div>
            </button>
          ))}
        </div>

        {/* Booking form */}
        {selectedTable && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Booking Table {selectedTable.tableNumber} — {selectedTable.capacity} seats
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Your Name"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  required
                  placeholder="Phone Number"
                  value={form.customerPhone}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  placeholder="Email (optional)"
                  type="email"
                  value={form.customerEmail}
                  onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  required
                  type="number"
                  min={1}
                  max={selectedTable.capacity}
                  placeholder="Guest Count"
                  value={form.guestCount}
                  onChange={e => setForm(f => ({ ...f, guestCount: parseInt(e.target.value) }))}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  required
                  type="date"
                  value={form.bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, bookingDate: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div className="flex gap-2">
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 flex-1"
                  />
                  <input
                    required
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 flex-1"
                  />
                </div>
              </div>
              <textarea
                placeholder="Special requests (optional)"
                value={form.specialRequests}
                onChange={e => setForm(f => ({ ...f, specialRequests: e.target.value }))}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm hover:bg-orange-50"
                >
                  Check Availability
                </button>
                {available !== null && (
                  <span className={`self-center text-sm font-medium ${available ? 'text-green-600' : 'text-red-500'}`}>
                    {available ? 'Available!' : 'Not available for this slot'}
                  </span>
                )}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || available === false}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookTablePage;
