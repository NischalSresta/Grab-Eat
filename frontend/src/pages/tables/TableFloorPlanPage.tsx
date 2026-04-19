import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Info, UtensilsCrossed, User, Calendar, Clock, Users } from 'lucide-react';
import { tableService } from '../../services/table.service';
import type { TableItem, BookingItem } from '../../types/table.types';
import { TABLE_FLOOR_LABELS } from '../../types/table.types';
import TableDiagram from '../../components/ui/TableDiagram';

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Not in use — available to book!',
  RESERVED: 'Reserved — booking confirmed',
  OCCUPIED: 'In use — customers are dining',
  MAINTENANCE: 'Out of Service',
};

const STATUS_CTA: Record<string, string | null> = {
  AVAILABLE: 'Book this table →',
  RESERVED: null,
  OCCUPIED: null,
  MAINTENANCE: null,
};

export default function TableFloorPlanPage() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingItem | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tableService.getAllTables();
      setTables(data);
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTableClick = async (table: TableItem) => {
    if (selectedTable?.id === table.id) {
      setSelectedTable(null);
      setBookingDetails(null);
      return;
    }
    setSelectedTable(table);
    setBookingDetails(null);
    if (table.status === 'RESERVED' || table.status === 'OCCUPIED') {
      setBookingLoading(true);
      try {
        const details = await tableService.getTableBookingDetails(table.id);
        setBookingDetails(details as BookingItem | null);
      } finally {
        setBookingLoading(false);
      }
    }
  };

  const handleBook = () => {
    navigate('/tables/book');
  };

  const available = tables.filter(t => t.status === 'AVAILABLE' && t.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Restaurant Floor Plan</h1>
              <p className="text-xs text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Hero + availability banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Live Table Availability</h2>
            <p className="text-orange-100 text-sm">
              See which tables are open right now. Click any table for details.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{available}</p>
              <p className="text-orange-200 text-xs">Available</p>
            </div>
            <button
              onClick={handleBook}
              className="bg-white text-orange-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors text-sm whitespace-nowrap"
            >
              Book a Table →
            </button>
          </div>
        </div>

        {/* Info bar */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
          <Info size={15} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-500">Click a table to see details.</span>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /><span className="text-gray-600 text-xs">Not In Use</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /><span className="text-gray-600 text-xs">Reserved</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /><span className="text-gray-600 text-xs">In Use</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /><span className="text-gray-600 text-xs">Out of Service</span></div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={28} className="animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Diagram */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <TableDiagram
                tables={tables.filter(t => t.status !== 'MAINTENANCE')}
                selectedTableId={selectedTable?.id}
                onTableClick={handleTableClick}
                readOnly
                showLegend
              />
            </div>

            {/* Selected table popup */}
            {selectedTable && (
              <div
                className={`rounded-2xl border-2 p-5 transition-all ${
                  selectedTable.status === 'AVAILABLE'
                    ? 'bg-gray-50 border-gray-200'
                    : selectedTable.status === 'RESERVED'
                    ? 'bg-green-50 border-green-400'
                    : selectedTable.status === 'OCCUPIED'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedTable.status === 'AVAILABLE' ? 'bg-gray-100' :
                      selectedTable.status === 'RESERVED' ? 'bg-green-100' :
                      selectedTable.status === 'OCCUPIED' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <UtensilsCrossed size={18} className={
                        selectedTable.status === 'AVAILABLE' ? 'text-gray-500' :
                        selectedTable.status === 'RESERVED' ? 'text-green-600' :
                        selectedTable.status === 'OCCUPIED' ? 'text-yellow-600' : 'text-red-500'
                      } />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        Table {selectedTable.tableNumber}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {TABLE_FLOOR_LABELS[selectedTable.floor]} · {selectedTable.capacity} seats
                      </p>
                      {selectedTable.description && (
                        <p className="text-gray-500 text-sm italic mt-0.5">
                          {selectedTable.description}
                        </p>
                      )}
                      <p className={`text-sm font-semibold mt-1.5 ${
                        selectedTable.status === 'AVAILABLE' ? 'text-gray-600' :
                        selectedTable.status === 'RESERVED' ? 'text-green-700' :
                        selectedTable.status === 'OCCUPIED' ? 'text-yellow-700' : 'text-red-600'
                      }`}>
                        {STATUS_LABELS[selectedTable.status]}
                      </p>
                    </div>
                  </div>
                  {STATUS_CTA[selectedTable.status] && (
                    <button
                      onClick={handleBook}
                      className="bg-orange-500 text-white px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm font-semibold whitespace-nowrap"
                    >
                      {STATUS_CTA[selectedTable.status]}
                    </button>
                  )}
                </div>

                {/* Booking details */}
                {bookingLoading && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-500">
                    <RefreshCw size={14} className="animate-spin" /> Loading booking info...
                  </div>
                )}
                {!bookingLoading && bookingDetails && (
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Guest</p>
                        <p className="text-sm font-semibold text-gray-900">{bookingDetails.userFullName}</p>
                        {bookingDetails.userEmail && (
                          <p className="text-xs text-gray-500">{bookingDetails.userEmail}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Party Size</p>
                        <p className="text-sm font-semibold text-gray-900">{bookingDetails.partySize} guests</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{bookingDetails.bookingDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Time</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {bookingDetails.startTime?.slice(0, 5)} – {bookingDetails.endTime?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    {bookingDetails.specialRequests && (
                      <div className="col-span-2 flex items-start gap-2">
                        <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Special Requests</p>
                          <p className="text-sm text-gray-700 italic">"{bookingDetails.specialRequests}"</p>
                        </div>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        bookingDetails.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        bookingDetails.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        Booking: {bookingDetails.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
