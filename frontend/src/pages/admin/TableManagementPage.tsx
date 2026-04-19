import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  UtensilsCrossed,
  LayoutGrid,
  List,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Users,
} from 'lucide-react';
import { tableService } from '../../services/table.service';
import type {
  TableItem,
  BookingItem,
  BookingStatus,
  TableFloor,
  TableStatus,
  CreateTableRequest,
  UpdateTableRequest,
} from '../../types/table.types';
import {
  TABLE_FLOOR_LABELS,
  TABLE_FLOOR_ICONS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
} from '../../types/table.types';
import { Button } from '../../components/ui';
import TableDiagram from '../../components/ui/TableDiagram';
import { useAuth } from '../../hooks/useAuth';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_FLOORS: TableFloor[] = ['INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE_DINING', 'TERRACE'];
const ALL_STATUSES: TableStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];

const STATUS_LABELS: Record<TableStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved (Booked)',
  MAINTENANCE: 'Maintenance',
};

const STATUS_COLORS: Record<TableStatus, string> = {
  AVAILABLE: 'bg-gray-100 text-gray-700',
  RESERVED: 'bg-green-100 text-green-700',
  OCCUPIED: 'bg-red-100 text-red-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
};

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

// ── Form state ────────────────────────────────────────────────────────────────

interface TableFormData {
  tableNumber: string;
  capacity: string;
  floor: TableFloor;
  status: TableStatus;
  description: string;
}

const EMPTY_FORM: TableFormData = {
  tableNumber: '',
  capacity: '4',
  floor: 'INDOOR',
  status: 'AVAILABLE',
  description: '',
};

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

interface TableModalProps {
  mode: 'add' | 'edit';
  initial?: TableItem | null;
  onClose: () => void;
  onSave: (data: CreateTableRequest | UpdateTableRequest, id?: number) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

function TableModal({ mode, initial, onClose, onSave, isSaving, error }: TableModalProps) {
  const [form, setForm] = useState<TableFormData>(
    initial
      ? {
          tableNumber: initial.tableNumber,
          capacity: initial.capacity.toString(),
          floor: initial.floor,
          status: initial.status,
          description: initial.description ?? '',
        }
      : EMPTY_FORM
  );

  const set = (field: keyof TableFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const capacity = parseInt(form.capacity, 10);
    if (!form.tableNumber.trim()) return;
    if (isNaN(capacity) || capacity < 1) return;

    if (mode === 'add') {
      await onSave({
        tableNumber: form.tableNumber.trim(),
        capacity,
        floor: form.floor,
        description: form.description.trim() || undefined,
      });
    } else {
      await onSave(
        {
          tableNumber: form.tableNumber.trim(),
          capacity,
          floor: form.floor,
          status: form.status,
          description: form.description.trim() || undefined,
        },
        initial?.id
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'add' ? 'Add New Table' : `Edit Table ${initial?.tableNumber}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Table Number <span className="text-red-500">*</span>
            </label>
            <input
              value={form.tableNumber}
              onChange={e => set('tableNumber', e.target.value)}
              placeholder="e.g. T-01, A1, VIP-1"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Seating Capacity <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('capacity', Math.max(1, parseInt(form.capacity || '1') - 1).toString())}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-colors"
              >
                −
              </button>
              <input
                value={form.capacity}
                onChange={e => set('capacity', e.target.value)}
                type="number"
                min="1"
                max="30"
                required
                className="w-24 text-center px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => set('capacity', Math.min(30, parseInt(form.capacity || '1') + 1).toString())}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-gray-500">people</span>
            </div>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Floor / Area <span className="text-red-500">*</span>
            </label>
            <select
              value={form.floor}
              onChange={e => set('floor', e.target.value as TableFloor)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
            >
              {ALL_FLOORS.map(f => (
                <option key={f} value={f}>
                  {TABLE_FLOOR_ICONS[f]} {TABLE_FLOOR_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          {/* Status (edit only) */}
          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as TableStatus)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Window seat with city view, corner table, near kitchen…"
              rows={2}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {isSaving ? 'Saving…' : mode === 'add' ? 'Add Table' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  table,
  onClose,
  onConfirm,
  isDeleting,
}: {
  table: TableItem;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Table?</h3>
          <p className="text-gray-500 text-sm">
            Table <strong>{table.tableNumber}</strong> ({TABLE_FLOOR_ICONS[table.floor]}{' '}
            {TABLE_FLOOR_LABELS[table.floor]}, {table.capacity} seats) will be deactivated and
            hidden from customers. Existing bookings are not affected.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {isDeleting ? 'Removing…' : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ViewTab = 'diagram' | 'list' | 'status';

export default function TableManagementPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwner = user?.role === 'OWNER';

  const [tables, setTables] = useState<TableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTab, setViewTab] = useState<ViewTab>('status');
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [tableBookings, setTableBookings] = useState<BookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState<number | null>(null);

  // Live status tab state
  const [statusBookings, setStatusBookings] = useState<BookingItem[]>([]);
  const [lastStatusBookings, setLastStatusBookings] = useState<Record<number, BookingItem>>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [deletingTable, setDeletingTable] = useState<TableItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [bookingActionLoading, setBookingActionLoading] = useState<number | null>(null);

  // Status toasts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const loadTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tableService.getAllTables();
      setTables(data);
    } catch {
      toast('Failed to load tables.', true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const loadSelectedTableBookings = useCallback(async (tableId: number) => {
    setBookingsLoading(true);
    try {
      const bookings = await tableService.adminGetBookingsByTable(tableId);
      setTableBookings(bookings);
    } catch {
      setTableBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTable) {
      setTableBookings([]);
      setQrBlobUrl(null);
      return;
    }
    loadSelectedTableBookings(selectedTable.id);
    // Load QR code image for this table
    setQrLoading(true);
    setQrBlobUrl(null);
    tableService.getTableQrCodeBlobUrl(selectedTable.id)
      .then(url => setQrBlobUrl(url))
      .catch(() => setQrBlobUrl(null))
      .finally(() => setQrLoading(false));
  }, [selectedTable, loadSelectedTableBookings]);

  useEffect(() => {
    if (!selectedTable) return;
    const intervalId = window.setInterval(() => {
      loadSelectedTableBookings(selectedTable.id);
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [selectedTable, loadSelectedTableBookings]);

  const loadStatusBookings = useCallback(async () => {
    setStatusLoading(true);
    try {
      const [bookings, allTables] = await Promise.all([
        tableService.adminGetActiveBookings(),
        tableService.getAllTables(),
      ]);
      setStatusBookings(bookings);

      // For OCCUPIED/RESERVED tables with no active booking, fetch their last booking
      const activeTableIds = new Set(bookings.map((b: BookingItem) => b.tableId));
      const orphaned = allTables.filter(
        (t: TableItem) => (t.status === 'OCCUPIED' || t.status === 'RESERVED') && !activeTableIds.has(t.id) && t.isActive
      );
      if (orphaned.length > 0) {
        const results = await Promise.allSettled(
          orphaned.map((t: TableItem) => tableService.adminGetBookingsByTable(t.id))
        );
        const map: Record<number, BookingItem> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value.length > 0) {
            map[orphaned[i].id] = r.value[0];
          }
        });
        setLastStatusBookings(map);
      } else {
        setLastStatusBookings({});
      }
    } catch {
      setStatusBookings([]);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewTab === 'status') {
      loadStatusBookings();
    }
  }, [viewTab, loadStatusBookings]);

  useEffect(() => {
    const tableIdParam = searchParams.get('tableId');
    const bookingIdParam = searchParams.get('bookingId');
    if (!tableIdParam || tables.length === 0) return;

    const tableId = Number(tableIdParam);
    if (Number.isNaN(tableId)) return;

    const target = tables.find(t => t.id === tableId);
    if (target) {
      setViewTab('diagram');
      setSelectedTable(target);
      if (bookingIdParam) {
        const parsedBookingId = Number(bookingIdParam);
        if (!Number.isNaN(parsedBookingId)) setHighlightedBookingId(parsedBookingId);
      }
      searchParams.delete('tableId');
      searchParams.delete('bookingId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [tables, searchParams, setSearchParams]);

  // Stats
  const stats = {
    total: tables.filter(t => t.isActive).length,
    available: tables.filter(t => t.status === 'AVAILABLE' && t.isActive).length,
    reserved: tables.filter(t => t.status === 'RESERVED' && t.isActive).length,
    occupied: tables.filter(t => t.status === 'OCCUPIED' && t.isActive).length,
    maintenance: tables.filter(t => t.status === 'MAINTENANCE').length,
  };

  // CRUD handlers
  const handleSave = async (
    data: CreateTableRequest | UpdateTableRequest,
    id?: number
  ) => {
    setIsSaving(true);
    setModalError(null);
    try {
      if (id !== undefined) {
        await tableService.adminUpdateTable(id, data as UpdateTableRequest);
        toast('Table updated successfully.');
      } else {
        await tableService.adminCreateTable(data as CreateTableRequest);
        toast('Table added successfully.');
      }
      setShowAddModal(false);
      setEditingTable(null);
      setSelectedTable(null);
      await loadTables();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save table. Please try again.';
      setModalError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookingAction = async (action: 'confirm' | 'complete' | 'cancel', bookingId: number) => {
    setBookingActionLoading(bookingId);
    try {
      if (action === 'confirm') await tableService.adminConfirmBooking(bookingId);
      else if (action === 'complete') await tableService.adminCompleteBooking(bookingId);
      else await tableService.adminCancelBooking(bookingId);
      toast(action === 'confirm' ? 'Booking confirmed.' : action === 'complete' ? 'Booking marked complete.' : 'Booking cancelled.');
      if (selectedTable) loadSelectedTableBookings(selectedTable.id);
      if (viewTab === 'status') { loadTables(); loadStatusBookings(); }
    } catch {
      toast('Action failed. Please try again.', true);
    } finally {
      setBookingActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingTable) return;
    setIsDeleting(true);
    try {
      await tableService.adminDeleteTable(deletingTable.id);
      toast(`Table ${deletingTable.tableNumber} removed.`);
      setDeletingTable(null);
      setSelectedTable(null);
      await loadTables();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to remove table.', true);
      setDeletingTable(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="text-red-600" size={24} />
            Table Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage restaurant tables, set capacity, floors, and monitor live status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTables}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isOwner && (
            <Button onClick={() => { setShowAddModal(true); setModalError(null); }}>
              <Plus size={16} />
              Add Table
            </Button>
          )}
        </div>
      </div>

      {/* Toast messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tables', value: stats.total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'Available', value: stats.available, color: 'text-gray-600', bg: 'bg-white border border-gray-200' },
          { label: 'Booked (Reserved)', value: stats.reserved, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Occupied', value: stats.occupied, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          ['status',  Users,      'Live Status' ],
          ['diagram', LayoutGrid, 'Floor Plan'  ],
          ['list',    List,       'All Tables'  ],
        ] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setViewTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── LIVE STATUS TAB ──────────────────────────────────────────────────── */}
      {viewTab === 'status' && (() => {
        if (statusLoading || isLoading) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          );
        }

        // Build booking map from statusBookings (CONFIRMED preferred over PENDING)
        const bookingMap = statusBookings.reduce<Record<number, BookingItem>>((acc, b) => {
          if (!acc[b.tableId] || b.status === 'CONFIRMED') acc[b.tableId] = b;
          return acc;
        }, {});

        const FLOOR_ORDER_ADMIN: TableFloor[] = ['INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE_DINING', 'TERRACE'];
        const FLOOR_CFG: Record<TableFloor, { label: string; emoji: string; bg: string }> = {
          INDOOR:        { label: 'Indoor',         emoji: '🏠', bg: 'rgba(59,130,246,0.1)'  },
          OUTDOOR:       { label: 'Outdoor',        emoji: '🌳', bg: 'rgba(16,185,129,0.1)'  },
          ROOFTOP:       { label: 'Rooftop',        emoji: '🌅', bg: 'rgba(249,115,22,0.1)'  },
          PRIVATE_DINING:{ label: 'Private Dining', emoji: '🍽️', bg: 'rgba(139,92,246,0.1)' },
          TERRACE:       { label: 'Terrace',        emoji: '☀️', bg: 'rgba(245,158,11,0.1)'  },
        };

        return (
          <div className="space-y-8">
            {/* Refresh button */}
            <div className="flex justify-end -mt-4">
              <button onClick={() => { loadTables(); loadStatusBookings(); }} className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {/* Floor-grouped sections */}
            {FLOOR_ORDER_ADMIN.map((floor, floorIdx) => {
              const floorTables = tables.filter(t => t.isActive && t.floor === floor && t.status !== 'MAINTENANCE');
              if (floorTables.length === 0) return null;
              const floorOccupied  = floorTables.filter(t => t.status === 'RESERVED' || t.status === 'OCCUPIED');
              const floorAvailable = floorTables.filter(t => t.status === 'AVAILABLE');
              const cfg = FLOOR_CFG[floor];
              return (
                <div key={floor}>
                  {/* Floor header */}
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cfg.bg }}>
                      {cfg.emoji}
                    </div>
                    <div>
                      <h2 className="font-black text-lg tracking-tight" style={{ color: 'var(--text-1)' }}>{cfg.label}</h2>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {floorOccupied.length} occupied · {floorAvailable.length} available
                      </p>
                    </div>
                  </div>

                  {/* Occupied tables */}
                  {floorOccupied.length > 0 && (
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Occupied</p>
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{floorOccupied.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {floorOccupied.map(table => {
                          const booking = bookingMap[table.id];
                          const isConfirmed = booking?.status === 'CONFIRMED';
                          return (
                          <div key={table.id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
                        isConfirmed ? 'border-green-200' : booking ? 'border-amber-200' : 'border-red-200'
                      }`}>
                        <div className={`h-1 ${isConfirmed ? 'bg-green-400' : booking ? 'bg-amber-400' : 'bg-red-400'}`} />
                        <div className="p-4">
                          {/* Table identity row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <UtensilsCrossed size={15} className="text-orange-500" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">Table {table.tableNumber}</p>
                                <p className="text-xs text-gray-400">{table.capacity} seats</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {booking ? (
                                <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${BOOKING_STATUS_COLORS[booking.status]}`}>
                                  {BOOKING_STATUS_LABELS[booking.status]}
                                </span>
                              ) : (
                                <span className="text-[11px] px-2 py-1 rounded-full font-semibold bg-red-100 text-red-700">Occupied</span>
                              )}
                              {isOwner && (
                                <button
                                  onClick={() => { setEditingTable(table); setModalError(null); }}
                                  className="p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition"
                                  title="Edit table"
                                >
                                  <Pencil size={12} className="text-blue-500" />
                                </button>
                              )}
                            </div>
                          </div>

                          {booking ? (
                            <>
                              {/* Customer info */}
                              <div className={`flex items-center gap-2.5 p-3 rounded-xl mb-3 ${isConfirmed ? 'bg-green-50' : 'bg-amber-50'}`}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                  isConfirmed ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
                                }`}>
                                  {booking.userFullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{booking.userFullName}</p>
                                  <p className="text-xs text-gray-500 truncate">{booking.userEmail}</p>
                                </div>
                              </div>

                              {/* Booking details grid */}
                              <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                                <div className="bg-gray-50 rounded-lg py-2 px-1">
                                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                    <Calendar size={9} className="text-gray-400" />
                                    <p className="text-[9px] text-gray-400 uppercase">Date</p>
                                  </div>
                                  <p className="text-[11px] font-bold text-gray-800">{booking.bookingDate}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg py-2 px-1">
                                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                    <Clock size={9} className="text-gray-400" />
                                    <p className="text-[9px] text-gray-400 uppercase">Time</p>
                                  </div>
                                  <p className="text-[11px] font-bold text-gray-800">{booking.startTime.slice(0,5)}–{booking.endTime.slice(0,5)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg py-2 px-1">
                                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                    <Users size={9} className="text-gray-400" />
                                    <p className="text-[9px] text-gray-400 uppercase">Party</p>
                                  </div>
                                  <p className="text-[11px] font-bold text-gray-800">{booking.partySize}p</p>
                                </div>
                              </div>

                              {booking.specialRequests && (
                                <p className="text-xs text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2 mb-3 truncate">
                                  💬 "{booking.specialRequests}"
                                </p>
                              )}

                              {/* Actions */}
                              <div className="flex gap-1.5 flex-wrap">
                                {booking.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => handleBookingAction('confirm', booking.id)} disabled={bookingActionLoading === booking.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition">
                                      <CheckCircle2 size={11} /> Confirm
                                    </button>
                                    <button onClick={() => handleBookingAction('cancel', booking.id)} disabled={bookingActionLoading === booking.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition">
                                      <X size={11} /> Decline
                                    </button>
                                  </>
                                )}
                                {booking.status === 'CONFIRMED' && (
                                  <>
                                    <button onClick={() => handleBookingAction('complete', booking.id)} disabled={bookingActionLoading === booking.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition">
                                      <CheckCircle2 size={11} /> Complete
                                    </button>
                                    <button onClick={() => handleBookingAction('cancel', booking.id)} disabled={bookingActionLoading === booking.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition">
                                      <X size={11} /> Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          ) : (() => {
                            const last = lastStatusBookings[table.id];
                            return (
                              <div>
                                {last ? (
                                  <>
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 mb-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {last.userFullName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-gray-700 text-sm truncate">{last.userFullName}</p>
                                        <p className="text-xs text-gray-400 truncate">{last.userEmail}</p>
                                      </div>
                                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-semibold flex-shrink-0">
                                        {last.status}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                                      <div className="bg-gray-50 rounded-lg py-2 px-1">
                                        <p className="text-[9px] text-gray-400 uppercase mb-0.5">Date</p>
                                        <p className="text-[11px] font-bold text-gray-600">{last.bookingDate}</p>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg py-2 px-1">
                                        <p className="text-[9px] text-gray-400 uppercase mb-0.5">Time</p>
                                        <p className="text-[11px] font-bold text-gray-600">{last.startTime.slice(0,5)}–{last.endTime.slice(0,5)}</p>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg py-2 px-1">
                                        <p className="text-[9px] text-gray-400 uppercase mb-0.5">Party</p>
                                        <p className="text-[11px] font-bold text-gray-600">{last.partySize}p</p>
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">
                                      Status not synced — last booking was {last.status.toLowerCase()}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-xs text-gray-400 text-center py-2 mb-3">No booking record found</p>
                                )}
                                {isOwner && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await tableService.adminUpdateTable(table.id, { status: 'AVAILABLE' });
                                        toast('Table reset to Available.');
                                        loadTables();
                                        loadStatusBookings();
                                      } catch {
                                        toast('Failed to reset table.', true);
                                      }
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                                  >
                                    Mark Available
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available tables for this floor */}
                  {floorAvailable.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Available</p>
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{floorAvailable.length}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {floorAvailable.map(table => (
                          <div key={table.id} className="card p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Table {table.tableNumber}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">Free</span>
                            </div>
                            <div className="flex items-center gap-1 mb-3" style={{ color: 'var(--text-3)' }}>
                              <Users size={10} />
                              <span className="text-xs">{table.capacity} seats</span>
                            </div>
                            {isOwner && (
                              <button
                                onClick={() => { setEditingTable(table); setModalError(null); }}
                                className="w-full flex items-center justify-center gap-1 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                              >
                                <Pencil size={11} /> Edit
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        );
      })()}

      {/* ── FLOOR PLAN TAB ─────────────────────────────────────────────────── */}
      {viewTab === 'diagram' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw size={28} className="animate-spin text-red-500" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <TableDiagram
                  tables={tables.filter(t => t.status !== 'MAINTENANCE')}
                  selectedTableId={selectedTable?.id}
                  onTableClick={t => {
                    setHighlightedBookingId(null);
                    setSelectedTable(prev => (prev?.id === t.id ? null : t));
                  }}
                  showLegend
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ALL TABLES LIST TAB ────────────────────────────────────────────── */}
      {viewTab === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw size={24} className="animate-spin text-red-500" />
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">No tables yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Table #', 'Floor / Area', 'Capacity', 'Status', 'Description', 'Actions'].map(
                      h => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tables.map(t => (
                    <tr
                      key={t.id}
                      className={`hover:bg-gray-50 transition-colors ${!t.isActive ? 'opacity-40' : ''} ${t.status === 'MAINTENANCE' ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">{t.tableNumber}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {TABLE_FLOOR_ICONS[t.floor]} {TABLE_FLOOR_LABELS[t.floor]}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t.capacity} seats</td>
                      <td className="px-4 py-3">
                        {t.status === 'MAINTENANCE' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                            ⚠️ Out of service — click Edit to fix
                          </span>
                        ) : (
                          <span
                            className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[t.status]}`}
                          >
                            {STATUS_LABELS[t.status]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {t.description || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isOwner && t.isActive ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingTable(t); setModalError(null); }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => setDeletingTable(t)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">{!t.isActive ? 'Removed' : '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Table Detail Sidebar ─────────────────────────────────────────────── */}
      {selectedTable && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedTable(null)}
          />

          {/* Sliding panel */}
          <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-white z-40 shadow-2xl flex flex-col">

            {/* Sidebar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🍽️</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Table {selectedTable.tableNumber}</h3>
                  <p className="text-xs text-gray-500">
                    {TABLE_FLOOR_LABELS[selectedTable.floor]} · {selectedTable.capacity} seats
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[selectedTable.status]}`}>
                  {STATUS_LABELS[selectedTable.status]}
                </span>
                {isOwner && (
                  <>
                    <button
                      onClick={() => { setEditingTable(selectedTable); setModalError(null); }}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Edit table"
                    >
                      <Pencil size={14} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => setDeletingTable(selectedTable)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Remove table"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-1"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* ── Active Reservation Banner ─────────────────────────────── */}
              {(() => {
                const confirmed = tableBookings.find(b => b.status === 'CONFIRMED');
                const pending   = tableBookings.find(b => b.status === 'PENDING');
                const active    = confirmed ?? pending;

                if (bookingsLoading) {
                  return <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />;
                }

                if (active) {
                  const isConfirmed = active.status === 'CONFIRMED';
                  return (
                    <div className={`rounded-2xl p-4 border-2 ${isConfirmed ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${isConfirmed ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${isConfirmed ? 'text-green-700' : 'text-amber-700'}`}>
                          {isConfirmed ? 'Reserved — Confirmed' : 'Reservation Pending'}
                        </p>
                      </div>
                      {/* Customer identity */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 ${isConfirmed ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                          {active.userFullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{active.userFullName}</p>
                          <p className="text-xs text-gray-500 truncate">{active.userEmail}</p>
                        </div>
                      </div>
                      {/* Booking details row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/70 rounded-lg py-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Date</p>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{active.bookingDate}</p>
                        </div>
                        <div className="bg-white/70 rounded-lg py-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Time</p>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{active.startTime.slice(0,5)}–{active.endTime.slice(0,5)}</p>
                        </div>
                        <div className="bg-white/70 rounded-lg py-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Party</p>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{active.partySize} {active.partySize === 1 ? 'person' : 'people'}</p>
                        </div>
                      </div>
                      {active.specialRequests && (
                        <p className="text-xs text-gray-600 italic mt-3 bg-white/70 rounded-lg px-3 py-2">
                          💬 "{active.specialRequests}"
                        </p>
                      )}
                      {/* Quick actions */}
                      {active.status === 'PENDING' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleBookingAction('confirm', active.id)}
                            disabled={bookingActionLoading === active.id}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition"
                          >
                            <CheckCircle2 size={13} /> Confirm
                          </button>
                          <button
                            onClick={() => handleBookingAction('cancel', active.id)}
                            disabled={bookingActionLoading === active.id}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition"
                          >
                            <X size={13} /> Decline
                          </button>
                        </div>
                      )}
                      {active.status === 'CONFIRMED' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleBookingAction('complete', active.id)}
                            disabled={bookingActionLoading === active.id}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50 transition"
                          >
                            <CheckCircle2 size={13} /> Mark Complete
                          </button>
                          <button
                            onClick={() => handleBookingAction('cancel', active.id)}
                            disabled={bookingActionLoading === active.id}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition"
                          >
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                if (selectedTable.status === 'OCCUPIED') {
                  return (
                    <div className="rounded-2xl p-4 border-2 border-red-200 bg-red-50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-red-700">Currently Occupied</p>
                      </div>
                      <p className="text-xs text-red-600">Table is in use — no advance booking on record.</p>
                    </div>
                  );
                }

                if (selectedTable.status === 'AVAILABLE') {
                  return (
                    <div className="rounded-2xl p-4 border border-gray-200 bg-gray-50 text-center">
                      <p className="text-sm font-semibold text-gray-500">Table is available</p>
                      <p className="text-xs text-gray-400 mt-0.5">No active reservations</p>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Description */}
              {selectedTable.description && (
                <p className="text-sm text-gray-500 italic bg-gray-50 rounded-xl px-4 py-3">
                  "{selectedTable.description}"
                </p>
              )}

              {/* QR Code */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Table QR Code</p>
                {qrLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <RefreshCw size={13} className="animate-spin" /> Generating…
                  </div>
                ) : qrBlobUrl ? (
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                    <img
                      src={qrBlobUrl}
                      alt={`QR for table ${selectedTable.tableNumber}`}
                      className="w-20 h-20 border border-gray-200 rounded-lg flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Scan to open the order page for this table.</p>
                      <a
                        href={qrBlobUrl}
                        download={`table-${selectedTable.tableNumber}-qr.png`}
                        className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                      >
                        Download QR
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">QR code unavailable.</p>
                )}
              </div>

              {/* Bookings section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Customer Bookings
                    {tableBookings.length > 0 && (
                      <span className="ml-2 bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {tableBookings.length}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => loadSelectedTableBookings(selectedTable.id)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Refresh
                  </button>
                </div>

                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : tableBookings.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-400">No bookings for this table</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tableBookings.map(booking => {
                      const isActive = ACTIVE_BOOKING_STATUSES.includes(booking.status);
                      const isHighlighted = highlightedBookingId === booking.id;
                      return (
                        <div
                          key={booking.id}
                          className={`rounded-xl border p-4 transition-colors ${
                            isHighlighted
                              ? 'border-amber-300 bg-amber-50'
                              : isActive
                              ? 'border-green-200 bg-green-50/50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          {/* Customer info */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                                {booking.userFullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{booking.userFullName}</p>
                                <p className="text-xs text-gray-500 truncate">{booking.userEmail}</p>
                              </div>
                            </div>
                            <span className={`text-[11px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ${BOOKING_STATUS_COLORS[booking.status]}`}>
                              {BOOKING_STATUS_LABELS[booking.status]}
                            </span>
                          </div>

                          {/* Booking meta grid */}
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-gray-500 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={11} className="text-gray-400 flex-shrink-0" />
                              {booking.bookingDate}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={11} className="text-gray-400 flex-shrink-0" />
                              {booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users size={11} className="text-gray-400 flex-shrink-0" />
                              {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                            </div>
                            <div className="text-gray-400">Booking #{booking.id}</div>
                          </div>

                          {/* Special requests */}
                          {booking.specialRequests && (
                            <p className="text-xs text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2 mt-2">
                              💬 "{booking.specialRequests}"
                            </p>
                          )}

                          {/* Action buttons */}
                          {booking.status === 'PENDING' && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleBookingAction('confirm', booking.id)}
                                disabled={bookingActionLoading === booking.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition"
                              >
                                <CheckCircle2 size={12} /> Confirm
                              </button>
                              <button
                                onClick={() => handleBookingAction('cancel', booking.id)}
                                disabled={bookingActionLoading === booking.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                              >
                                <X size={12} /> Decline
                              </button>
                            </div>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleBookingAction('complete', booking.id)}
                                disabled={bookingActionLoading === booking.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition"
                              >
                                <CheckCircle2 size={12} /> Complete
                              </button>
                              <button
                                onClick={() => handleBookingAction('cancel', booking.id)}
                                disabled={bookingActionLoading === booking.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                              >
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {(showAddModal || editingTable) && (
        <TableModal
          mode={editingTable ? 'edit' : 'add'}
          initial={editingTable}
          onClose={() => { setShowAddModal(false); setEditingTable(null); }}
          onSave={handleSave}
          isSaving={isSaving}
          error={modalError}
        />
      )}

      {deletingTable && (
        <DeleteConfirmModal
          table={deletingTable}
          onClose={() => setDeletingTable(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
