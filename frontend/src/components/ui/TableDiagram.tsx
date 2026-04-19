import { UtensilsCrossed } from 'lucide-react';
import type { TableItem, TableFloor, TableStatus } from '../../types/table.types';
import { TABLE_FLOOR_LABELS } from '../../types/table.types';

// Status visual config
// AVAILABLE  = white/neutral (table is free)
// RESERVED   = yellow        (booking pending)
// OCCUPIED   = red           (confirmed / people seated)
// MAINTENANCE = gray

const STATUS_CONFIG: Record<
  TableStatus,
  { box: string; border: string; dot: string; label: string }
> = {
  AVAILABLE: {
    box: 'bg-white hover:bg-gray-50',
    border: 'border-gray-200 hover:border-gray-300',
    dot: 'bg-gray-300',
    label: 'Not In Use',
  },
  RESERVED: {
    box: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-500 hover:border-green-600',
    dot: 'bg-green-500',
    label: 'Reserved',
  },
  OCCUPIED: {
    box: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-400 hover:border-yellow-500',
    dot: 'bg-yellow-400',
    label: 'In Use',
  },
  MAINTENANCE: {
    box: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-400 hover:border-red-500',
    dot: 'bg-red-400',
    label: 'Out of Service',
  },
};

// Floor section background tints

const FLOOR_BG: Record<TableFloor, string> = {
  INDOOR: 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  OUTDOOR: 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  ROOFTOP: 'bg-violet-50/60 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
  PRIVATE_DINING: 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  TERRACE: 'bg-orange-50/60 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
};

const FLOOR_HEADER: Record<TableFloor, string> = {
  INDOOR: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50',
  OUTDOOR: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50',
  ROOFTOP: 'text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/50',
  PRIVATE_DINING: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50',
  TERRACE: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50',
};

// Single table box

interface TableBoxProps {
  table: TableItem;
  isSelected?: boolean;
  onClick?: (table: TableItem) => void;
  readOnly?: boolean;
}

function TableBox({ table, isSelected, onClick, readOnly }: TableBoxProps) {
  const cfg = STATUS_CONFIG[table.status];
  const isDisabled = table.status === 'MAINTENANCE';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => !isDisabled && onClick?.(table)}
        disabled={isDisabled && readOnly}
        title={`Table ${table.tableNumber} · ${table.capacity} seats · ${cfg.label}`}
        className={`
          relative w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5
          transition-all duration-200 select-none
          ${cfg.box} ${cfg.border}
          ${isSelected ? 'ring-4 ring-orange-400 ring-offset-2 scale-105 shadow-lg' : ''}
          ${!isDisabled ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-not-allowed opacity-50'}
        `}
      >
        {/* Table number */}
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">{table.tableNumber}</span>

        {/* Table icon */}
        <UtensilsCrossed size={14} className="text-gray-400 dark:text-gray-500" />

        {/* Capacity */}
        <span className="text-xs text-gray-500 dark:text-gray-400 leading-none">{table.capacity}p</span>
      </button>
    </div>
  );
}

// Main diagram component

export interface TableDiagramProps {
  tables: TableItem[];
  selectedTableId?: number;
  onTableClick?: (table: TableItem) => void;
  readOnly?: boolean;
  showLegend?: boolean;
  compact?: boolean;
}

export default function TableDiagram({
  tables,
  selectedTableId,
  onTableClick,
  readOnly = false,
  showLegend = true,
  compact = false,
}: TableDiagramProps) {
  const FLOOR_ORDER: TableFloor[] = [
    'INDOOR',
    'OUTDOOR',
    'ROOFTOP',
    'PRIVATE_DINING',
    'TERRACE',
  ];

  const grouped = FLOOR_ORDER.reduce<Record<string, TableItem[]>>((acc, floor) => {
    const floorTables = tables.filter(t => t.floor === floor && t.isActive && t.status !== 'MAINTENANCE');
    if (floorTables.length > 0) acc[floor] = floorTables;
    return acc;
  }, {});

  const floorsPresent = Object.keys(grouped) as TableFloor[];

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <UtensilsCrossed size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No tables configured yet.</p>
        {!readOnly && (
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add tables using the button above.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {floorsPresent.map(floor => (
        <div
          key={floor}
          className={`rounded-2xl border-2 border-dashed ${FLOOR_BG[floor]} ${compact ? 'p-4' : 'p-6'}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${FLOOR_HEADER[floor]}`}
            >
              {TABLE_FLOOR_LABELS[floor]}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">
              {grouped[floor].length} table{grouped[floor].length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-wrap gap-6">
            {grouped[floor]
              .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }))
              .map(table => (
                <TableBox
                  key={table.id}
                  table={table}
                  isSelected={selectedTableId === table.id}
                  onClick={onTableClick}
                  readOnly={readOnly}
                />
              ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Legend</span>
          {([
            { color: 'bg-gray-300', label: 'Not In Use' },
            { color: 'bg-green-500', label: 'Reserved' },
            { color: 'bg-yellow-400', label: 'In Use' },
          ] as const).map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
