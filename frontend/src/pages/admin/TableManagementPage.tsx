import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TableDiagram from '../../components/ui/TableDiagram';

const FLOORS = ['GROUND', 'FIRST', 'SECOND', 'ROOFTOP'];

interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  floor: string;
}

const TableManagementPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedFloor, setSelectedFloor] = useState('GROUND');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', capacity: 2, floor: 'GROUND' });
  const [loading, setLoading] = useState(false);

  const fetchTables = async () => {
    const res = await axios.get('/api/v1/tables');
    setTables(res.data);
  };

  useEffect(() => { fetchTables(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/v1/tables', form);
      setShowForm(false);
      setForm({ tableNumber: '', capacity: 2, floor: 'GROUND' });
      fetchTables();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this table?')) return;
    await axios.delete(`/api/v1/tables/${id}`);
    fetchTables();
  };

  const handleRegenerateQr = async (id: number) => {
    await axios.post(`/api/v1/tables/${id}/regenerate-qr`);
    alert('QR token regenerated');
  };

  const floorTables = tables.filter(t => t.floor === selectedFloor);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Table Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Table
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {FLOORS.map(floor => (
          <button
            key={floor}
            onClick={() => setSelectedFloor(floor)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFloor === floor
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {floor.charAt(0) + floor.slice(1).toLowerCase()} Floor
          </button>
        ))}
      </div>

      <TableDiagram
        tables={floorTables}
        onTableClick={(t) => {
          if (confirm(`Delete table ${t.tableNumber}?`)) handleDelete(t.id);
        }}
      />

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">All Tables</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 border">Table #</th>
              <th className="p-3 border">Floor</th>
              <th className="p-3 border">Capacity</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-3 border font-medium">{t.tableNumber}</td>
                <td className="p-3 border capitalize">{t.floor.toLowerCase()}</td>
                <td className="p-3 border">{t.capacity}</td>
                <td className="p-3 border">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    t.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                    t.status === 'OCCUPIED' ? 'bg-red-100 text-red-700' :
                    t.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-3 border">
                  <button
                    onClick={() => handleRegenerateQr(t.id)}
                    className="text-blue-600 hover:underline text-xs mr-3"
                  >
                    Regen QR
                  </button>
                  <a
                    href={`/api/v1/qr/table/${t.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-600 hover:underline text-xs mr-3"
                  >
                    Download QR
                  </a>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Table</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Table Number</label>
                <input
                  value={form.tableNumber}
                  onChange={e => setForm({ ...form, tableNumber: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g. T01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Floor</label>
                <select
                  value={form.floor}
                  onChange={e => setForm({ ...form, floor: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  {FLOORS.map(f => (
                    <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()} Floor</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Table'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementPage;
