import { useState, useEffect } from 'react';
import { loyaltyService } from '../../services/loyalty.service';
import type { Reward, CreateRewardRequest } from '../../types/loyalty.types';
import { Gift, Plus, Trash2, Zap, Trophy, Star, Award } from 'lucide-react';

const TIER_INFO = [
  { tier: 'BRONZE', range: '0 – 499 pts', icon: <Award size={18} className="text-amber-600" />, bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  { tier: 'SILVER', range: '500 – 999 pts', icon: <Star size={18} className="text-gray-500" />, bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-200 text-gray-700' },
  { tier: 'GOLD',   range: '1,000+ pts',   icon: <Trophy size={18} className="text-yellow-500" />, bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' },
];

const PRESETS: CreateRewardRequest[] = [
  { name: 'Free Drink', description: 'Redeem for any house drink of your choice', pointsCost: 100, discountAmount: 150 },
  { name: 'Free Dessert', description: 'Treat yourself to any dessert on the menu', pointsCost: 150, discountAmount: 200 },
  { name: '10% Bill Discount', description: '10% off your total bill', pointsCost: 250, discountAmount: 350 },
  { name: 'Birthday Special', description: 'Extra discount for birthday celebrations', pointsCost: 400, discountAmount: 600 },
  { name: 'VIP Upgrade', description: 'Priority seating + complimentary starter', pointsCost: 600, discountAmount: 900 },
];

export default function LoyaltyManagementPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateRewardRequest>({ name: '', description: '', pointsCost: 100, discountAmount: 50 });
  const [pointsCostStr, setPointsCostStr] = useState('100');
  const [discountStr, setDiscountStr] = useState('50');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRewards(await loyaltyService.getAvailableRewards());
    } catch {
      setError('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await loyaltyService.createReward(form);
      setRewards(prev => [...prev, created]);
      setShowForm(false);
      setForm({ name: '', description: '', pointsCost: 100, discountAmount: 50 });
      setPointsCostStr('100');
      setDiscountStr('50');
    } catch {
      setError('Failed to create reward');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this reward?')) return;
    try {
      await loyaltyService.deleteReward(id);
      setRewards(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('Failed to delete reward');
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight"><span className="text-gradient">Loyalty & Rewards</span></h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer reward catalogue</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
        >
          <Plus size={16} /> New Reward
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      {/* Tier Overview */}
      <div className="grid grid-cols-3 gap-4">
        {TIER_INFO.map(t => (
          <div key={t.tier} className={`rounded-xl border p-4 ${t.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              {t.icon}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badge}`}>{t.tier}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{t.range}</p>
            <p className="text-xs text-gray-400 mt-0.5">lifetime points</p>
          </div>
        ))}
      </div>

      {/* Quick Presets */}
      {rewards.length === 0 && !loading && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-orange-500" />
            <p className="text-sm font-semibold text-orange-800">Quick Start — Add preset rewards</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const created = await loyaltyService.createReward(preset);
                    setRewards(prev => [...prev, created]);
                  } catch { setError('Failed to add preset'); }
                  finally { setSaving(false); }
                }}
                disabled={saving}
                className="px-3 py-1.5 bg-white border border-orange-300 hover:bg-orange-100 text-orange-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => (
            <div key={reward.id} className="card p-5 animate-fade-up" style={{ animationDelay: `${rewards.indexOf(reward) * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Gift size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                    <p className="text-xs text-orange-600 font-medium">{reward.pointsCost} pts</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(reward.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {reward.description && (
                <p className="text-sm text-gray-500 mt-3">{reward.description}</p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-700">Discount: <span className="font-semibold text-green-700">NPR {reward.discountAmount}</span></p>
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <Gift size={40} className="mx-auto mb-3 opacity-30" />
              <p>No rewards yet. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Reward Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.55)'}}>
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 modal-enter">
            <h2 className="text-lg font-bold text-gray-900">Create Reward</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required maxLength={150}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points Cost</label>
                  <input
                    type="number" min={1}
                    value={pointsCostStr}
                    onChange={e => {
                      setPointsCostStr(e.target.value);
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n)) setForm(p => ({ ...p, pointsCost: n }));
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (NPR)</label>
                  <input
                    type="number" min={0} step="0.01"
                    value={discountStr}
                    onChange={e => {
                      setDiscountStr(e.target.value);
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n)) setForm(p => ({ ...p, discountAmount: n }));
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
