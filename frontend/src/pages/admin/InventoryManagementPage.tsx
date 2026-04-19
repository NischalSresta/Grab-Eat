import { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventory.service';
import type { Ingredient, CreateIngredientRequest, AdjustStockRequest, InventoryLogType } from '../../types/inventory.types';
import { AlertTriangle, Plus, Package, ArrowUpDown } from 'lucide-react';

type Tab = 'ingredients' | 'lowstock' | 'logs';

export default function InventoryManagementPage() {
  const [tab, setTab] = useState<Tab>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStock, setLowStock] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<{ id: number; ingredientName: string; type: string; quantityChange: number; stockAfter: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateIngredientRequest>({ name: '', unit: '', currentStock: 0, minStockLevel: 0, costPerUnit: 0 });
  const [saving, setSaving] = useState(false);

  // Adjust stock modal
  const [adjustTarget, setAdjustTarget] = useState<Ingredient | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustStockRequest>({ quantityChange: 0, type: 'RESTOCK' });
  const [adjusting, setAdjusting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [all, low] = await Promise.all([
        inventoryService.getAllIngredients(),
        inventoryService.getLowStockIngredients(),
      ]);
      setIngredients(all);
      setLowStock(low);
      if (tab === 'logs') {
        const logData = await inventoryService.getLogs();
        setLogs(logData.content as any);
      }
    } catch {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadLogs = async () => {
    try {
      const logData = await inventoryService.getLogs();
      setLogs(logData.content as any);
    } catch (e) { }
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === 'logs') loadLogs();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await inventoryService.createIngredient(form);
      setIngredients(prev => [...prev, created]);
      setShowForm(false);
      setForm({ name: '', unit: '', currentStock: 0, minStockLevel: 0, costPerUnit: 0 });
    } catch {
      setError('Failed to create ingredient');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjusting(true);
    try {
      const updated = await inventoryService.adjustStock(adjustTarget.id, adjustForm);
      setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
      setAdjustTarget(null);
      setAdjustForm({ quantityChange: 0, type: 'RESTOCK' });
    } catch {
      setError('Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this ingredient?')) return;
    try {
      await inventoryService.deleteIngredient(id);
      setIngredients(prev => prev.map(i => i.id === id ? { ...i, isActive: false } : i));
    } catch {
      setError('Failed to deactivate ingredient');
    }
  };

  const activeIngredients = ingredients.filter(i => i.isActive);

  return (
    <div className="p-6 animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          {lowStock.length > 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
              <AlertTriangle size={14} />
              {lowStock.length} ingredient(s) are running low
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
        >
          <Plus size={16} /> Add Ingredient
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['ingredients', 'lowstock', 'logs'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'lowstock' ? `Low Stock${lowStock.length > 0 ? ` (${lowStock.length})` : ''}` : t === 'logs' ? 'Activity Log' : 'All Ingredients'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          {tab === 'ingredients' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Min Level</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Cost/Unit</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeIngredients.map(ing => (
                    <tr key={ing.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{ing.name}</td>
                      <td className="px-4 py-3 text-gray-500">{ing.unit}</td>
                      <td className={`px-4 py-3 text-right font-mono ${ing.isLowStock ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {ing.currentStock}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">{ing.minStockLevel}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">NPR {ing.costPerUnit}</td>
                      <td className="px-4 py-3 text-right">
                        {ing.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">
                            <AlertTriangle size={10} /> Low
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setAdjustTarget(ing); setAdjustForm({ quantityChange: 0, type: 'RESTOCK' }); }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            <ArrowUpDown size={12} /> Adjust
                          </button>
                          <button
                            onClick={() => handleDelete(ing.id)}
                            className="px-2 py-1 rounded text-xs bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeIngredients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                        No ingredients yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'lowstock' && (
            <div className="space-y-3">
              {lowStock.length === 0 ? (
                <div className="text-center py-12 text-gray-400">All ingredients are sufficiently stocked.</div>
              ) : lowStock.map(ing => (
                <div key={ing.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-red-800">{ing.name}</p>
                    <p className="text-sm text-red-600">
                      Current: <strong>{ing.currentStock} {ing.unit}</strong> · Minimum: {ing.minStockLevel} {ing.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => { setAdjustTarget(ing); setAdjustForm({ quantityChange: 0, type: 'RESTOCK' }); setTab('ingredients'); }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'logs' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ingredient</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Change</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Stock After</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{log.ingredientName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.type === 'RESTOCK' ? 'bg-green-100 text-green-700' :
                          log.type === 'ORDER_DEDUCTION' ? 'bg-blue-100 text-blue-700' :
                          log.type === 'WASTAGE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${log.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.quantityChange >= 0 ? '+' : ''}{log.quantityChange}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">{log.stockAfter}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No log entries</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Ingredient Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add Ingredient</h2>
            <div className="space-y-3">
              {([
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Unit (e.g. kg, L, pcs)', key: 'unit', type: 'text' },
                { label: 'Current Stock', key: 'currentStock', type: 'number' },
                { label: 'Min Stock Level', key: 'minStockLevel', type: 'number' },
                { label: 'Cost per Unit (NPR)', key: 'costPerUnit', type: 'number' },
              ] as const).map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
                {saving ? 'Saving...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAdjust} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Adjust Stock — {adjustTarget.name}</h2>
            <p className="text-sm text-gray-500">Current stock: <strong>{adjustTarget.currentStock} {adjustTarget.unit}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Change (use negative to deduct)</label>
                <input
                  type="number"
                  value={adjustForm.quantityChange}
                  onChange={e => setAdjustForm(prev => ({ ...prev, quantityChange: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={adjustForm.type}
                  onChange={e => setAdjustForm(prev => ({ ...prev, type: e.target.value as InventoryLogType }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="RESTOCK">Restock</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                  <option value="WASTAGE">Wastage</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setAdjustTarget(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={adjusting} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
                {adjusting ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
