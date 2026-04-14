import React, { useEffect, useState } from 'react';
import { tableService } from '../../services/table.service';
import type { RestaurantTable, TableFloor } from '../../types/table.types';
import TableDiagram from '../../components/ui/TableDiagram';

const FLOORS: TableFloor[] = ['GROUND', 'FIRST', 'SECOND', 'ROOFTOP'];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 border-green-400 text-green-700',
  OCCUPIED: 'bg-red-100 border-red-400 text-red-700',
  RESERVED: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  OUT_OF_SERVICE: 'bg-gray-100 border-gray-300 text-gray-500',
};

const TableFloorPlanPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<TableFloor>('GROUND');
  const [selected, setSelected] = useState<RestaurantTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    tableService
      .getTablesByFloor(selectedFloor)
      .then(setTables)
      .catch(console.error)
      .finally(() => setLoading(false));
    setSelected(null);
  }, [selectedFloor]);

  const summary = {
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Floor Plan</h1>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">{summary.available} Available</span>
            <span className="text-red-500 font-medium">{summary.occupied} Occupied</span>
            <span className="text-yellow-600 font-medium">{summary.reserved} Reserved</span>
          </div>
        </div>

        {/* Floor tabs */}
        <div className="flex gap-2 mb-6">
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
              {floor.charAt(0) + floor.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading floor plan...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => setSelected(table)}
                className={`border-2 rounded-xl p-4 text-left transition-all hover:shadow-md ${
                  selected?.id === table.id ? 'ring-2 ring-orange-400' : ''
                } ${STATUS_COLORS[table.status] ?? 'bg-white border-gray-200'}`}
              >
                <TableDiagram capacity={table.capacity} status={table.status} />
                <div className="mt-2 font-semibold text-sm">Table {table.tableNumber}</div>
                <div className="text-xs">{table.capacity} seats</div>
              </button>
            ))}
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:relative md:mt-6 md:rounded-xl md:shadow md:border">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Table {selected.tableNumber}</h3>
                <p className="text-sm text-gray-500">{selected.capacity} seats · {selected.floor} floor</p>
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableFloorPlanPage;
