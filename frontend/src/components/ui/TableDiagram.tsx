import React from 'react';

interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  floor: string;
}

interface TableDiagramProps {
  tables: Table[];
  onTableClick?: (table: Table) => void;
  selectedTableId?: number | null;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 border-green-500 text-green-800',
  OCCUPIED: 'bg-red-100 border-red-500 text-red-800',
  RESERVED: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  OUT_OF_SERVICE: 'bg-gray-100 border-gray-400 text-gray-500',
};

const TableDiagram: React.FC<TableDiagramProps> = ({ tables, onTableClick, selectedTableId }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4">
      {tables.map((table) => (
        <div
          key={table.id}
          onClick={() => onTableClick?.(table)}
          className={`
            border-2 rounded-lg p-3 text-center cursor-pointer transition-all
            ${statusColors[table.status] ?? 'bg-white border-gray-300'}
            ${selectedTableId === table.id ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'}
          `}
        >
          <div className="font-bold text-sm">{table.tableNumber}</div>
          <div className="text-xs mt-1">{table.capacity} seats</div>
          <div className="text-xs mt-1 capitalize">{table.status.toLowerCase().replace('_', ' ')}</div>
        </div>
      ))}
      {tables.length === 0 && (
        <div className="col-span-full text-center text-gray-400 py-8">No tables on this floor</div>
      )}
    </div>
  );
};

export default TableDiagram;
