import { useState, useEffect } from 'react';
import { recommendationService } from '../../services/recommendation.service';
import type { TopPick } from '../../types/recommendation.types';
import { TrendingUp, RefreshCw, Star } from 'lucide-react';

const RANK_COLORS = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-400'];

export default function TopPicksPage() {
  const [picks, setPicks] = useState<TopPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setPicks(await recommendationService.getTopPicks());
    } catch {
      setError('Failed to load top picks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const compute = async () => {
    setComputing(true);
    setError('');
    try {
      await recommendationService.computeTopPicks();
      setSuccessMsg('Top picks recomputed successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await load();
    } catch {
      setError('Failed to recompute — requires OWNER role');
    } finally {
      setComputing(false);
    }
  };

  return (
    <div className="p-6 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Top Picks</h1>
          <p className="text-sm text-gray-500 mt-1">AI-ranked most popular items based on 4-week weighted order history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={compute}
            disabled={computing}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-60"
          >
            <TrendingUp size={15} />
            {computing ? 'Computing...' : 'Recompute Now'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm">{successMsg}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : picks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 mb-4">No top picks computed yet for this week.</p>
          <button onClick={compute} disabled={computing} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
            {computing ? 'Computing...' : 'Compute Now'}
          </button>
        </div>
      ) : (
        <>
          {picks[0]?.weekStart && (
            <p className="text-sm text-gray-500 mb-4">Week of <span className="font-medium text-gray-700">{picks[0].weekStart}</span></p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {picks.map((pick, idx) => (
              <div key={pick.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition relative overflow-hidden">
                {/* Rank badge */}
                <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${RANK_COLORS[idx] ?? 'bg-gray-400'}`}>
                  {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${pick.rank}`}
                </div>

                <div className="flex items-start gap-3 pr-8">
                  {pick.imageUrl ? (
                    <img src={pick.imageUrl} alt={pick.menuItemName} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <Star size={20} className="text-orange-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{pick.menuItemName}</p>
                    {pick.categoryName && <p className="text-xs text-orange-600 font-medium">{pick.categoryName}</p>}
                    <p className="text-sm text-gray-700 mt-1">NPR {Number(pick.price).toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>{pick.totalOrdered} orders</span>
                  <span className="font-medium text-gray-700">Score: {Number(pick.score ?? 0).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
